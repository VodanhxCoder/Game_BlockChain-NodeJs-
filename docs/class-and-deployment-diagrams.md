# Class Diagram and Deployment Diagram

This document is generated from the current workspace implementation (models, shared associations, and docker-compose runtime topology).

## 1) Domain Class Diagram

```mermaid
---
id: 2c34b5da-a2cf-4a3d-acad-ef9dafde8973
---
classDiagram
  direction LR

  class User {
    +username: string
    +email: string
    +role: enum
    +status: enum
    +highScore: int
    +walletAddress: string
    +validPassword(candidatePassword: string): bool
  }

  class Inventory {
    +inventoryId: int
    +username: string
    +createdAt: datetime
  }

  class InventoryItem {
    +inventoryItemId: int
    +inventoryId: int
    +itemId: int
    +owner: string
    +itemHash: string
    +inMarket: bool
    +obtainedAt: datetime
  }

  class Item {
    +itemId: int
    +name: string
    +imageUrl: string
    +rarity: enum
    +createdAt: datetime
  }

  class DropPool {
    +dropId: int
    +itemId: int
    +dropRate: decimal
    +active: bool
  }

  class MarketListing {
    +listingId: int
    +itemHash: string
    +wantedItemId: int
    +seller: string
    +tier: enum
    +sellerSignature: text
    +sellerSignatureTimestamp: long
  }

  class TradeLog {
    +tradeId: int
    +itemHash: string
    +tradeItemHash: string
    +fromUser: string
    +toUser: string
    +transactionHash: string
    +transactionType: enum
    +status: enum
    +listingId: int
    +metadata: json
  }

  class BlockchainTransaction {
    +txId: int
    +transactionHash: string
    +transactionType: enum
    +status: enum
    +blockNumber: int
    +listingId: int
    +itemHash: string
  }

  User "1" *-- "1" Inventory : owns
  Inventory "1" *-- "0..*" InventoryItem : contains

  User "1" --> "0..*" InventoryItem : owner
  User "1" --> "0..*" MarketListing : seller

  Item "1" --> "0..*" DropPool : dropPools
  Item "1" --> "0..*" InventoryItem : itemType
  Item "1" --> "0..*" MarketListing : wantedItem

  InventoryItem "1" --> "0..1" MarketListing : listedAs

  TradeLog "0..*" --> "1" InventoryItem : tradedItem
  TradeLog "0..*" --> "0..1" User : fromUser
  TradeLog "0..*" --> "0..1" User : toUser
  TradeLog "0..*" --> "0..1" MarketListing : listing

  BlockchainTransaction ..> TradeLog : tx correlation
```

## 2) Deployment Diagram (Docker Microservices Runtime)

```mermaid
flowchart LR
  classDef device fill:#e7decd,stroke:#5e584f,stroke-width:2px,color:#222;
  classDef env fill:#f6f1e5,stroke:#857f74,stroke-width:1.5px,color:#222;
  classDef artifact fill:#fffdf8,stroke:#9f988d,stroke-width:1.2px,color:#222;
  classDef ext fill:#f5f5f5,stroke:#777,stroke-dasharray:4 2,color:#222;

  subgraph presentation["<<device>> Presentation Server"]
    subgraph webEnv["<<execution environment>> Web Application Server"]
      clientApp["ClientApp (React/Vite)"]
    end
  end

  subgraph identity["<<device>> Policy / Identity Server"]
    subgraph authEnv["<<execution environment>> Application Server"]
      authSvc["auth-service:4001"]
      userSvc["user-service:4002"]
      adminSvc["admin-service:4007"]
      fail2banSvc["fail2ban-service:5000"]
    end
  end

  subgraph core["<<device>> Product Server"]
    subgraph appEnv["<<execution environment>> Application Server"]
      invSvc["inventory-service:4003"]
      marketSvc["marketplace-service:4004"]
      tradeSvc["trade-service:4005"]
      gameSvc["game-service:4008 (Socket.IO)"]
      chainSvc["blockchain-service:4006"]
    end
    subgraph ruleEnv["<<execution environment>> Rules Engine / Blockchain Runtime"]
      hardhatNode["hardhat node:8545"]
      contractArtifact["ItemTradingNFT Contract"]
    end
  end

  subgraph dataNode["<<device>> Database Server"]
    subgraph rdbms["<<execution environment>> RDBMS"]
      mysqlDB[("MySQL:3306")]
      userSchema["User/Profile schema"]
      marketSchema["Inventory/Market/Trade schema"]
    end
  end

  subgraph ciNode["<<device>> Deployment Worker"]
    deployJob["deploy-contract job"]
  end

  scaleNote["To be clustered to meet throughput needs"]

  clientApp --> authSvc
  clientApp --> userSvc
  clientApp --> adminSvc
  clientApp --> invSvc
  clientApp --> marketSvc
  clientApp --> tradeSvc
  clientApp --> gameSvc
  clientApp --> chainSvc

  authSvc --> fail2banSvc

  authSvc --> mysqlDB
  userSvc --> mysqlDB
  adminSvc --> mysqlDB
  fail2banSvc --> mysqlDB
  invSvc --> mysqlDB
  marketSvc --> mysqlDB
  tradeSvc --> mysqlDB
  gameSvc --> mysqlDB
  chainSvc --> mysqlDB

  chainSvc --> hardhatNode
  tradeSvc --> hardhatNode
  deployJob --> hardhatNode
  hardhatNode --> contractArtifact
  deployJob -. "updates contract address" .-> chainSvc

  identity -.-> scaleNote
  core -.-> scaleNote

  userSchema --- marketSchema

  class presentation,identity,core,dataNode,ciNode device;
  class webEnv,authEnv,appEnv,ruleEnv,rdbms env;
  class clientApp,authSvc,userSvc,adminSvc,fail2banSvc,invSvc,marketSvc,tradeSvc,gameSvc,chainSvc,deployJob,contractArtifact,userSchema,marketSchema artifact;
  class scaleNote ext;
```
