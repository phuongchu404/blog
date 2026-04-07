# Post Management Lifecycle & Data Flow

This document describes the technical flow of a Blog Post, from creation in the Admin Dashboard to its persistence in the database and synchronization with Elasticsearch for high-performance searching.

## 1. Creation & Update Flow

The process of saving a post involves multiple layers to ensure data integrity and real-time search updates.

```mermaid
sequenceDiagram
    participant Admin as Admin UI (create.html)
    participant API as PostController
    participant Service as PostServiceImpl
    participant DB as MySQL Database
    participant Kafka as Kafka (blog.events.post)
    participant ES as Elasticsearch (PostDocument)

    Admin->>API: POST /api/posts (PostDTO)
    API->>Service: createPost(postDTO)
    
    rect rgb(240, 248, 255)
    Note over Service, DB: Core Persistence
    Service->>Service: Mapping DTO to Entity
    Service->>DB: Save Post entity (Basic info, Status, SEO)
    Service->>DB: Sync Tags (PostTagRepository)
    Service->>DB: Sync Categories (PostCategoryRepository)
    end

    rect rgb(255, 240, 245)
    Note over Service, ES: Async Synchronization
    Service->>Kafka: Send Status Event (JSON)
    Kafka-->>Service: Ack
    Kafka->>ES: Consumer (ElasticsearchSyncService)
    ES->>ES: Update PostDocument index
    end

    Service-->>API: Return PostDTO
    API-->>Admin: 201 Created / 200 OK
```

### Key Components:
- **`PostDTO`**: Decouples the API from the database. It uses ID-based inputs (`tagIds`, `categoryIds`) for creation and returns full objects (`tags`, `categories`) for display.
- **`PostMapper`**: Handles the transformation between DTOs and JPA Entities using MapStruct.
- **`PostServiceImpl`**: Orchestrates the logic, including:
    - Generating slugs from titles.
    - Handling status-based publishing dates.
    - Managing many-to-many relationships (Tags/Categories).
    - Tracking uploaded files to prevent orphaned assets.

---

## 2. Post Status Workflow

Posts follow a three-state transition model stored in the `status` column of the `post` table.

| Status | Code | Description |
| :--- | :--- | :--- |
| **Draft** | `0` | Default state. Only visible in the Admin Dashboard. |
| **Published** | `1` | Visible to public users on the frontend. `publishedAt` date is set. |
| **Archived** | `2` | Hidden from the public frontend but preserved in the database for reference. |

> [!NOTE]
> Public APIs (like `/api/posts/published` or `/api/posts/search`) only return posts where `status = 1`.

---

## 3. Search Flow (Hybrid Search)

The system uses a "Search Aside" pattern, prioritizing Elasticsearch for speed but falling back to MySQL if necessary.

```mermaid
graph TD
    User([User Keyword Search]) --> API[PostController /search]
    API --> Service[PostServiceImpl searchPosts]
    Service --> ES{Elasticsearch Index}
    
    ES -- Found --> Match[Fetch IDs from ES Document]
    Match --> Filter[Filter status = 1 in MySQL]
    Filter --> UI([Show Results])
    
    ES -- Not Found / Error --> MySQL[MySQL LIKE %keyword%]
    MySQL --> UI
```

### Advantages of this flow:
1.  **Speed**: Elasticsearch handles complex text analysis and indexing.
2.  **Reliability**: MySQL serves as the ground truth if the index is out of sync.
3.  **Data Integrity**: Even if ES finds a match, the system verifies the status in MySQL before displaying it to the user.

---

## 4. Featured Image & Asset Tracking

When an image is uploaded as a **Featured Image** or inside the **CKEditor** content:
1.  The file is uploaded to **MinIO** storage.
2.  An entry is created in `upload_tracker` table with `status = UNUSED`.
3.  When the post is saved, `UploadTrackerService` scans the content and the featured image URL.
4.  Matches are marked as `USED`.
5.  A background task periodically deletes `UNUSED` files from MinIO to save space.
