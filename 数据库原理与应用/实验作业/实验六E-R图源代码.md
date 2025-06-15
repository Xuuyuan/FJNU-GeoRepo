```mermaid
erDiagram
    USER {
        varchar UserId PK
        varchar Password
        datetime AccountCreationTime
        varchar Nickname
        varchar Gender
        varchar ContactInfo
        varchar University
        varchar Major
        varchar Grade
        text PersonalProfile
    }
    PROJECT {
        varchar ProjectId PK
        varchar ProjectName
        text ProjectBackground
        text ProjectDescription
        text ProjectContent
        varchar ProjectStatus
        datetime InitiationTime
        datetime ExpectedCompletionTime
        varchar CurrentProgress
    }
    ADMIN {
        varchar AdminId PK
        varchar Password
        datetime AccountCreationTime
        varchar Permissions
        varchar Nickname
        varchar Gender
        varchar ContactInfo
    }
    PROJECT_EVALUATION {
        varchar EvaluationId PK
        varchar EvaluationType
        datetime EvaluationTime
        text EvaluationContent
    }
    TEAM_REQUEST {
        varchar RequestId PK
        datetime RequestTime
        varchar TeamPurpose
        varchar TeamType
        int RequiredNumber
        text RequestDetails
        varchar RequestStatus
    }
    ANNOUNCEMENT {
        varchar AnnouncementId PK
        varchar AnnouncementTitle
        text AnnouncementContent
    }
    TAG {
        varchar TagName PK
        varchar TagCategory
    }

    USER ||--o{ PROJECT : "参与"
    USER ||--o{ PROJECT_EVALUATION : "发表"
    USER ||--o{ TEAM_REQUEST : "发起"
    USER ||--o{ USER : "关系"
    PROJECT_EVALUATION ||--o{ PROJECT : "属于"
    TEAM_REQUEST ||--o| PROJECT : "对应"
    PROJECT ||--o{ TAG : "包含"
    ADMIN ||--o{ ANNOUNCEMENT : "管理"
    ADMIN ||--o{ PROJECT : "审核"