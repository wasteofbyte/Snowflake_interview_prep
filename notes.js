/**
 * Snowflake Interview Lab · Notes & Google Spreadsheet Integration
 * Features:
 * - Option to add notes on each topic right next to each topic tag
 * - Single master entry point in the top nav to enter password and enable notes across all modules (Default: snowflake)
 * - Auto-persistence across all modules via localStorage
 * - Google Spreadsheet sync via Google Apps Script Web App
 * - Local offline resilience & CSV export
 */

(function () {
  'use strict';

  // Constants & Storage Keys
  const STORAGE_KEYS = {
    NOTES: 'sf_notes_data',
    DELETED: 'sf_deleted_note_ids',
    SHEET_URL: 'sf_google_sheet_url',
    PW_HASH: 'sf_notes_pw_hash',
    GLOBAL_UNLOCKED: 'sf_notes_global_unlocked'
  };

  // Master password hash (SHA-256)
  const DEFAULT_PW_HASH = 'de5a1adf4fedcce1533915edc60177547f1057b61b7119fd130e1f7428705f73';

  // Default Google Spreadsheet Apps Script Web App URL (Active & Deployed)
  const DEFAULT_GOOGLE_SHEET_URL = 'https://script.google.com/macros/s/AKfycbypxM0ognU_fDqpu7dZnjOFY6rpSfbrSxSt4fS8gIFrT4Nqxje-T1I4aKJTUCHd-Sc/exec';

  // All known course modules & topics for dropdown selection
  const ALL_TOPICS = [
    'Module 01: Architecture',
    'Module 02: Load & Automate',
    'Module 03: Performance Tuning',
    'Module 04: Data Ingestion',
    'Module 05: Dynamic Tables & Transforms',
    'Module 06: Semi-structured Data',
    'Module 07: Data Protection',
    'Module 08: Security & Governance',
    'Module 09: Cost Optimization',
    'Module 10: Data Sharing & Collaboration',
    'Module 11: Snowpark & Cortex AI',
    'Module 12: Advanced SQL',
    'Module 13: Modeling & Tooling',
    'Module 14: Enterprise Architecture & Governance',
    'Module 15: External Integrations',
    'Module 16: IaC, CI/CD & Orchestration',
    'Deep Dive: SnowSQL, Streams & Tasks',
    'Deep Dive: JSON S3 → Snowflake'
  ];

  const COURSE_SEARCH_INDEX = [{"m": "module01", "mn": "Module 01: Architecture & Storage", "cat": "Architecture & Compute", "a": "intro", "t": "How Snowflake actually works.", "s": "Almost every Snowflake interview question traces back to this module, whether it's about performance, cost, caching, cloning or Time Travel. If you un", "tags": ["start", "here", "how", "snowflake", "actually", "works", "interview", "question", "traces", "back", "module", "whether"]}, {"m": "module01", "mn": "Module 01: Architecture & Storage", "cat": "Architecture & Compute", "a": "big", "t": "The big picture \u00b7 three layers", "s": "Snowflake is a fully managed cloud data platform (a data warehouse delivered as SaaS). It runs on AWS, Azure or Google Cloud. There's nothing for you ", "tags": ["big", "picture", "three", "layers", "snowflake", "fully", "managed", "cloud", "data", "platform", "warehouse", "delivered"]}, {"m": "module01", "mn": "Module 01: Architecture & Storage", "cat": "Architecture & Compute", "a": "storage", "t": "Storage layer & micro-partitions", "s": "When you load data, Snowflake automatically cuts every table into small, immutable files called micro-partitions . Each one holds 50\u2013500 MB of uncompr", "tags": ["storage", "amp", "micro-partitions", "layer", "you", "load", "data", "snowflake", "automatically", "cuts", "table", "small"]}, {"m": "module01", "mn": "Module 01: Architecture & Storage", "cat": "Architecture & Compute", "a": "compute", "t": "Compute: virtual warehouses & scaling up", "s": "A virtual warehouse is a named cluster of compute (CPU, memory and local SSD) that runs your queries, DML and loads. It holds no permanent data . Size", "tags": ["compute", "warehouses", "scale", "virtual", "scaling", "warehouse", "named", "cluster", "cpu", "memory", "local", "ssd"]}, {"m": "module01", "mn": "Module 01: Architecture & Storage", "cat": "Architecture & Compute", "a": "scaleout", "t": "Scale out: multi-cluster warehouses", "s": "A multi-cluster warehouse (Enterprise edition and above) is a single warehouse name backed by several clusters of the same size . You set MIN_CLUSTER_", "tags": ["scale", "out", "multi-cluster", "warehouses", "warehouse", "enterprise", "edition", "above", "single", "name", "backed", "several"]}, {"m": "module01", "mn": "Module 01: Architecture & Storage", "cat": "Architecture & Compute", "a": "cloud", "t": "Cloud services layer \u00b7 the brain", "s": "A set of always-on services, run by Snowflake across multiple availability zones, that coordinate everything : logins, query planning, metadata, trans", "tags": ["cloud", "services", "layer", "brain", "set", "always-on", "run", "snowflake", "across", "multiple", "availability", "zones"]}, {"m": "module01", "mn": "Module 01: Architecture & Storage", "cat": "Architecture & Compute", "a": "cache", "t": "The three caches \u00b7 asked in almost every interview", "s": "Picture a dashboard where 50 people open the same chart. Only the first query actually runs.", "tags": ["three", "caches", "asked", "interview", "picture", "dashboard", "where", "people", "same", "chart", "query", "actually"]}, {"m": "module01", "mn": "Module 01: Architecture & Storage", "cat": "Architecture & Compute", "a": "billing", "t": "How billing works \u00b7 per second, 60 s minimum", "s": "Snowflake bills three things separately:", "tags": ["how", "billing", "works", "per", "second", "minimum", "snowflake", "bills", "three", "things", "separately", "three-layer"]}, {"m": "module01", "mn": "Module 01: Architecture & Storage", "cat": "Architecture & Compute", "a": "editions", "t": "Editions \u00b7 what you get at each tier", "s": "Snowflake comes in four editions: Standard, Enterprise, Business Critical and Virtual Private Snowflake (VPS) . Each tier includes everything in the t", "tags": ["editions", "you", "get", "each", "tier", "snowflake", "comes", "four", "standard", "enterprise", "business", "critical"]}, {"m": "module01", "mn": "Module 01: Architecture & Storage", "cat": "Architecture & Compute", "a": "sql", "t": "SQL lab \u00b7 click any line for an explanation", "s": "", "tags": ["sql", "lab", "any", "line", "explanation", "three-layer", "architecture", "micro-partitions", "virtual", "warehouses", "caching", "billing"]}, {"m": "module01", "mn": "Module 01: Architecture & Storage", "cat": "Architecture & Compute", "a": "qa", "t": "Interview Q&A \u00b7 answer out loud first, then open", "s": "", "tags": ["interview", "amp", "answer", "out", "loud", "then", "three-layer", "architecture", "micro-partitions", "virtual", "warehouses", "caching"]}, {"m": "module01", "mn": "Module 01: Architecture & Storage", "cat": "Architecture & Compute", "a": "quiz", "t": "Quiz \u00b7 12 questions", "s": "", "tags": ["quiz", "questions", "three-layer", "architecture", "micro-partitions", "virtual", "warehouses", "caching", "billing"]}, {"m": "module01", "mn": "Module 01: Architecture & Storage", "cat": "Architecture & Compute", "a": "cheat", "t": "Cheat sheet \u00b7 if you remember only these", "s": "Press \"Start the journey\". Each step highlights the component involved and moves the red dot (your query).", "tags": ["cheat", "sheet", "you", "remember", "press", "start", "journey", "each", "step", "highlights", "component", "involved"]}, {"m": "module02", "mn": "Module 02: SnowSQL, Streams & Tasks", "cat": "Ingestion & Pipelines", "a": "intro", "t": "Get data in. Keep it moving.", "s": "Module 1 showed how Snowflake is built. This module covers how data actually gets into it and keeps flowing: SnowSQL to move files from your laptop, t", "tags": ["start", "here", "get", "data", "keep", "moving", "module", "showed", "how", "snowflake", "built", "covers"]}, {"m": "module02", "mn": "Module 02: SnowSQL, Streams & Tasks", "cat": "Ingestion & Pipelines", "a": "snowsql", "t": "SnowSQL \u00b7 Snowflake from your terminal", "s": "SnowSQL is Snowflake's command-line client . You install it on your laptop or a server, type snowsql , and get a prompt where you can run any SQL plus", "tags": ["snowsql", "snowflake", "terminal", "command-line", "client", "you", "install", "laptop", "server", "type", "get", "prompt"]}, {"m": "module02", "mn": "Module 02: SnowSQL, Streams & Tasks", "cat": "Ingestion & Pipelines", "a": "put", "t": "Inside PUT & COPY \u00b7 what happens in the backend", "s": "Loading a local file into a table is two separate steps :", "tags": ["inside", "put", "amp", "copy", "happens", "backend", "loading", "local", "file", "table", "two", "separate"]}, {"m": "module02", "mn": "Module 02: SnowSQL, Streams & Tasks", "cat": "Ingestion & Pipelines", "a": "unstruct", "t": "Unstructured data \u00b7 PDFs, audio, images in Snowflake", "s": "Data comes in three shapes. Click each one to see how Snowflake stores it:", "tags": ["unstructured", "data", "pdfs", "audio", "images", "snowflake", "comes", "three", "shapes", "each", "one", "see"]}, {"m": "module02", "mn": "Module 02: SnowSQL, Streams & Tasks", "cat": "Ingestion & Pipelines", "a": "ulab", "t": "Processing lab \u00b7 turn files into rows", "s": "Pick a file, then pick how to process it. You'll see the SQL , a sample output , and what happens in the backend . Outputs are illustrative examples.", "tags": ["processing", "lab", "turn", "files", "rows", "pick", "file", "then", "how", "process", "you", "see"]}, {"m": "module02", "mn": "Module 02: SnowSQL, Streams & Tasks", "cat": "Ingestion & Pipelines", "a": "streams", "t": "Streams \u00b7 \"what changed since last time?\"", "s": "A stream is an object that records which rows changed in a table (or view, directory table, external table\u2026) since a bookmark called the offset . You ", "tags": ["streams", "changed", "since", "last", "time", "stream", "object", "records", "which", "rows", "table", "view"]}, {"m": "module02", "mn": "Module 02: SnowSQL, Streams & Tasks", "cat": "Ingestion & Pipelines", "a": "tasks", "t": "Tasks \u00b7 Snowflake's built-in scheduler", "s": "A task runs one SQL statement or stored procedure call on a schedule ( SCHEDULE = '5 MINUTE' or a CRON expression with a time zone), or after another ", "tags": ["tasks", "snowflake", "built-in", "scheduler", "task", "runs", "one", "sql", "statement", "stored", "procedure", "call"]}, {"m": "module02", "mn": "Module 02: SnowSQL, Streams & Tasks", "cat": "Ingestion & Pipelines", "a": "e2e", "t": "Streams + tasks together \u00b7 a live CDC pipeline", "s": "This is the classic pattern from interviews: new orders land in RAW_ORDERS , a stream marks them as new, and every minute a task checks the stream. If", "tags": ["streams", "tasks", "together", "live", "cdc", "pipeline", "classic", "pattern", "interviews", "new", "orders", "land"]}, {"m": "module02", "mn": "Module 02: SnowSQL, Streams & Tasks", "cat": "Ingestion & Pipelines", "a": "procs", "t": "Stored procedures \u00b7 programs that run inside Snowflake", "s": "A stored procedure is a named program saved in a schema and run with CALL my_proc(args) . Inside, it can run many SQL statements plus real programming", "tags": ["stored", "procedures", "programs", "run", "inside", "snowflake", "procedure", "named", "program", "saved", "schema", "call"]}, {"m": "module02", "mn": "Module 02: SnowSQL, Streams & Tasks", "cat": "Ingestion & Pipelines", "a": "sql", "t": "SQL lab \u00b7 click any line for an explanation", "s": "", "tags": ["sql", "lab", "any", "line", "explanation", "snowsql", "cli", "put", "copy", "internals", "cdc", "streams"]}, {"m": "module02", "mn": "Module 02: SnowSQL, Streams & Tasks", "cat": "Ingestion & Pipelines", "a": "qa", "t": "Interview Q&A \u00b7 answer out loud first, then open", "s": "", "tags": ["interview", "amp", "answer", "out", "loud", "then", "snowsql", "cli", "put", "copy", "internals", "cdc"]}, {"m": "module02", "mn": "Module 02: SnowSQL, Streams & Tasks", "cat": "Ingestion & Pipelines", "a": "quiz", "t": "Quiz \u00b7 14 questions", "s": "", "tags": ["quiz", "questions", "snowsql", "cli", "put", "copy", "internals", "cdc", "streams", "scheduled", "tasks", "stored"]}, {"m": "module02", "mn": "Module 02: SnowSQL, Streams & Tasks", "cat": "Ingestion & Pipelines", "a": "cheat", "t": "Cheat sheet \u00b7 if you remember only these", "s": "Example: an ORDERS table with order_id, date, amount. Loaded with COPY into table columns and stored as micro-partitions. Query directly with SQL.", "tags": ["cheat", "sheet", "you", "remember", "example", "orders", "table", "order_id", "date", "amount", "loaded", "copy"]}, {"m": "module03", "mn": "Module 03: Performance Tuning", "cat": "Performance & SQL", "a": "intro", "t": "Make it fast. Know why it was slow.", "s": "Module 1 showed how Snowflake is built: micro-partitions, warehouses, three cache layers. This module turns that knowledge into a skill interviewers t", "tags": ["start", "here", "make", "fast", "know", "why", "was", "slow", "module", "showed", "how", "snowflake"]}, {"m": "module03", "mn": "Module 03: Performance Tuning", "cat": "Performance & SQL", "a": "profile", "t": "Reading the Query Profile \u00b7 the X-ray of a query", "s": "The Query Profile (in Snowsight: Query History \u2192 pick a query \u2192 Query Profile tab) is a visual execution plan with real runtime numbers . It's a tree ", "tags": ["reading", "query", "profile", "x-ray", "snowsight", "history", "pick", "tab", "visual", "execution", "plan", "real"]}, {"m": "module03", "mn": "Module 03: Performance Tuning", "cat": "Performance & SQL", "a": "cluster", "t": "Clustering keys \u00b7 & automatic clustering", "s": "Every table is stored as micro-partitions (roughly 50\u2013500 MB of uncompressed data each). For every column, Snowflake keeps the min and max value per p", "tags": ["clustering", "keys", "automatic", "table", "stored", "micro-partitions", "roughly", "500", "uncompressed", "data", "each", "column"]}, {"m": "module03", "mn": "Module 03: Performance Tuning", "cat": "Performance & SQL", "a": "sos", "t": "Search Optimization Service \u00b7 needle-in-a-haystack queries", "s": "The Search Optimization Service (SOS) is a table-level feature (Enterprise Edition and higher) that builds and maintains a persistent data structure c", "tags": ["search", "optimization", "service", "needle-in-a-haystack", "queries", "sos", "table-level", "feature", "enterprise", "edition", "higher", "builds"]}, {"m": "module03", "mn": "Module 03: Performance Tuning", "cat": "Performance & SQL", "a": "qas", "t": "Query Acceleration Service \u00b7 borrow extra muscle for outliers", "s": "The Query Acceleration Service (QAS) is a warehouse setting (Enterprise Edition and higher). When a query on that warehouse is eligible , Snowflake of", "tags": ["query", "acceleration", "service", "borrow", "extra", "muscle", "outliers", "qas", "warehouse", "setting", "enterprise", "edition"]}, {"m": "module03", "mn": "Module 03: Performance Tuning", "cat": "Performance & SQL", "a": "mv", "t": "Materialized views vs dynamic tables vs result cache \u00b7 precompute or reuse", "s": "Three ways to avoid recomputing the same answer:", "tags": ["mvs", "dynamic", "tables", "cache", "materialized", "views", "result", "precompute", "reuse", "three", "ways", "avoid"]}, {"m": "module03", "mn": "Module 03: Performance Tuning", "cat": "Performance & SQL", "a": "antipat", "t": "Joins & SQL anti-patterns \u00b7 the cheapest fix is often the SQL", "s": "A join combines rows from two inputs on a condition. Inside a multi-node warehouse, the optimizer must decide how to bring matching rows onto the same", "tags": ["joins", "amp", "sql", "anti-patterns", "cheapest", "fix", "often", "join", "combines", "rows", "two", "inputs"]}, {"m": "module03", "mn": "Module 03: Performance Tuning", "cat": "Performance & SQL", "a": "wh", "t": "Warehouse tuning & a full debugging walkthrough \u00b7 size, clusters, guardrails", "s": "The warehouse is the compute your query gets. You tune it along two axes:", "tags": ["warehouse", "tuning", "amp", "debugging", "full", "walkthrough", "size", "clusters", "guardrails", "compute", "query", "gets"]}, {"m": "module03", "mn": "Module 03: Performance Tuning", "cat": "Performance & SQL", "a": "sql", "t": "SQL lab \u00b7 click any line for an explanation", "s": "", "tags": ["sql", "lab", "any", "line", "explanation", "query", "profile", "clustering", "keys", "search", "optimization", "acceleration"]}, {"m": "module03", "mn": "Module 03: Performance Tuning", "cat": "Performance & SQL", "a": "qa", "t": "Interview Q&A \u00b7 answer out loud first, then open", "s": "", "tags": ["interview", "amp", "answer", "out", "loud", "then", "query", "profile", "clustering", "keys", "search", "optimization"]}, {"m": "module03", "mn": "Module 03: Performance Tuning", "cat": "Performance & SQL", "a": "quiz", "t": "Quiz \u00b7 14 questions", "s": "", "tags": ["quiz", "questions", "query", "profile", "clustering", "keys", "search", "optimization", "acceleration", "anti-patterns"]}, {"m": "module03", "mn": "Module 03: Performance Tuning", "cat": "Performance & SQL", "a": "cheat", "t": "Cheat sheet \u00b7 if you remember only these", "s": "`; const side = x1 === x2 ? 0 : (x1 ${lbl} `; }); c.nodes.forEach(n => { const cls = n.p === maxP ? 'hot' : n.p >= 15 ? 'warm' : '', x = n.x - W / 2, ", "tags": ["cheat", "sheet", "you", "remember", "const", "side", "lbl", "nodes", "foreach", "cls", "maxp", "hot"]}, {"m": "module04", "mn": "Module 04: Data Ingestion & Snowpipe", "cat": "Ingestion & Pipelines", "a": "intro", "t": "Land it once. Land it right.", "s": "Module 02 showed the basics: PUT a file to a stage, then COPY INTO a table. Real platforms go much further. Files arrive every few seconds from hundre", "tags": ["start", "here", "land", "once", "right", "module", "showed", "basics", "put", "file", "stage", "then"]}, {"m": "module04", "mn": "Module 04: Data Ingestion & Snowpipe", "cat": "Ingestion & Pipelines", "a": "patterns", "t": "Ingestion patterns map \u00b7 latency vs cost vs complexity", "s": "There are four main ways to get data into (or in front of) Snowflake:", "tags": ["ingestion", "patterns", "map", "latency", "cost", "complexity", "there", "are", "four", "main", "ways", "get"]}, {"m": "module04", "mn": "Module 04: Data Ingestion & Snowpipe", "cat": "Ingestion & Pipelines", "a": "stages", "t": "Stages & storage integrations \u00b7 the loading dock and its key card", "s": "A stage is a named pointer to a place where files live. Internal stages keep the files in Snowflake-managed storage. External stages point at your buc", "tags": ["stages", "amp", "integrations", "storage", "loading", "dock", "its", "key", "card", "stage", "named", "pointer"]}, {"m": "module04", "mn": "Module 04: Data Ingestion & Snowpipe", "cat": "Ingestion & Pipelines", "a": "copy", "t": "COPY INTO deep dive \u00b7 errors, validation, reloads, transforms", "s": "Module 02 covered the happy path ( PUT then COPY INTO , and the 64-day load metadata). Here we look at what senior engineers actually tune: what happe", "tags": ["copy", "deep", "dive", "errors", "validation", "reloads", "transforms", "module", "covered", "happy", "path", "put"]}, {"m": "module04", "mn": "Module 04: Data Ingestion & Snowpipe", "cat": "Ingestion & Pipelines", "a": "sizing", "t": "File sizing & parallelism \u00b7 why 100\u2013250 MB?", "s": "Snowflake's guidance is to aim for data files of roughly 100\u2013250 MB compressed for loading (with COPY or Snowpipe). The size and number of files decid", "tags": ["file", "sizing", "amp", "parallelism", "why", "100", "250", "snowflake", "guidance", "aim", "data", "files"]}, {"m": "module04", "mn": "Module 04: Data Ingestion & Snowpipe", "cat": "Ingestion & Pipelines", "a": "snowpipe", "t": "Snowpipe \u00b7 continuous, serverless file loading", "s": "A pipe is a named object that wraps one COPY INTO statement . Snowflake runs that COPY for you, on serverless compute , every time new files are repor", "tags": ["snowpipe", "continuous", "serverless", "file", "loading", "pipe", "named", "object", "wraps", "one", "copy", "statement"]}, {"m": "module04", "mn": "Module 04: Data Ingestion & Snowpipe", "cat": "Ingestion & Pipelines", "a": "streaming", "t": "Snowpipe Streaming \u00b7 rows in seconds, no files", "s": "Snowpipe Streaming lets a client write rows straight into Snowflake tables. There are no staged files and no COPY. You use it through:", "tags": ["snowpipe", "streaming", "rows", "seconds", "files", "lets", "client", "write", "straight", "snowflake", "tables", "there"]}, {"m": "module04", "mn": "Module 04: Data Ingestion & Snowpipe", "cat": "Ingestion & Pipelines", "a": "lake", "t": "External tables vs Apache Iceberg tables \u00b7 query the lake in place", "s": "External table : a read-only table over files in an external stage. Snowflake stores only metadata about the files; each row has a VALUE VARIANT colum", "tags": ["external", "amp", "iceberg", "tables", "apache", "query", "lake", "place", "table", "read-only", "over", "files"]}, {"m": "module04", "mn": "Module 04: Data Ingestion & Snowpipe", "cat": "Ingestion & Pipelines", "a": "schema", "t": "Schema detection, evolution & unloading \u00b7 when the file changes shape", "s": "Sources change: a product team adds coupon_code to an event, or a vendor drops a column. Without detection and evolution, someone writes DDL by hand f", "tags": ["schema", "evolution", "amp", "unload", "detection", "unloading", "file", "changes", "shape", "sources", "change", "product"]}, {"m": "module04", "mn": "Module 04: Data Ingestion & Snowpipe", "cat": "Ingestion & Pipelines", "a": "sql", "t": "SQL lab \u00b7 click any line for an explanation", "s": "", "tags": ["sql", "lab", "any", "line", "explanation", "stages", "copy", "snowpipe", "continuous", "loading", "streaming", "apache"]}, {"m": "module04", "mn": "Module 04: Data Ingestion & Snowpipe", "cat": "Ingestion & Pipelines", "a": "qa", "t": "Interview Q&A \u00b7 answer out loud first, then open", "s": "", "tags": ["interview", "amp", "answer", "out", "loud", "then", "stages", "copy", "snowpipe", "continuous", "loading", "streaming"]}, {"m": "module04", "mn": "Module 04: Data Ingestion & Snowpipe", "cat": "Ingestion & Pipelines", "a": "quiz", "t": "Quiz \u00b7 14 questions", "s": "", "tags": ["quiz", "questions", "stages", "copy", "snowpipe", "continuous", "loading", "streaming", "apache", "iceberg", "tables"]}, {"m": "module04", "mn": "Module 04: Data Ingestion & Snowpipe", "cat": "Ingestion & Pipelines", "a": "cheat", "t": "Cheat sheet \u00b7 if you remember only these", "s": "Batch COPY INTO on a warehouse (scheduled), Snowpipe (continuous, file-based, serverless), Snowpipe Streaming (row-based via SDK or Kafka connector, s", "tags": ["cheat", "sheet", "you", "remember", "batch", "copy", "warehouse", "scheduled", "snowpipe", "continuous", "file-based", "serverless"]}, {"m": "module05", "mn": "Module 05: Dynamic Tables & Transforms", "cat": "Ingestion & Pipelines", "a": "intro", "t": "Describe the result. Let Snowflake keep it fresh.", "s": "Module 04 got raw data into Snowflake. This module is about what happens next: turning messy raw rows into clean, trustworthy tables that dashboards a", "tags": ["start", "here", "describe", "result", "let", "snowflake", "keep", "fresh", "module", "got", "raw", "data"]}, {"m": "module05", "mn": "Module 05: Dynamic Tables & Transforms", "cat": "Ingestion & Pipelines", "a": "dt", "t": "Dynamic tables \u00b7 a SELECT that keeps itself fresh", "s": "A dynamic table (DT) is a table whose contents are defined by a query. You don't INSERT into it; Snowflake refreshes it so that it matches the query r", "tags": ["dynamic", "tables", "select", "keeps", "itself", "fresh", "table", "whose", "contents", "are", "defined", "query"]}, {"m": "module05", "mn": "Module 05: Dynamic Tables & Transforms", "cat": "Ingestion & Pipelines", "a": "incr", "t": "Incremental vs full refresh \u00b7 the deep dive", "s": "Full refresh re-runs the whole query and swaps in the result. Simple, always correct, cost grows with the size of the inputs .", "tags": ["incremental", "full", "refresh", "deep", "dive", "re-runs", "whole", "query", "swaps", "result", "simple", "always"]}, {"m": "module05", "mn": "Module 05: Dynamic Tables & Transforms", "cat": "Ingestion & Pipelines", "a": "choose", "t": "DT vs streams + tasks vs MV vs view \u00b7 picking the right tool", "s": "Four ways to give users \"a table that reflects a query\": a view (computed every time someone queries it), a materialized view (pre-computed and kept c", "tags": ["streams", "view", "tasks", "picking", "right", "tool", "four", "ways", "give", "users", "table", "reflects"]}, {"m": "module05", "mn": "Module 05: Dynamic Tables & Transforms", "cat": "Ingestion & Pipelines", "a": "merge", "t": "MERGE patterns \u00b7 upserts, deletes, SCD Type 1 & 2", "s": "MERGE compares a source (new data) with a target table on a key and, in one statement, decides per row what to do:", "tags": ["merge", "amp", "scd", "patterns", "upserts", "deletes", "type", "compares", "source", "new", "data", "target"]}, {"m": "module05", "mn": "Module 05: Dynamic Tables & Transforms", "cat": "Ingestion & Pipelines", "a": "dedup", "t": "Deduplication & idempotency \u00b7 run it twice, get the same answer", "s": "Deduplication keeps exactly one row per business key. The Snowflake idiom is QUALIFY ROW_NUMBER() OVER (PARTITION BY key ORDER BY version DESC) = 1 : ", "tags": ["dedup", "amp", "idempotency", "deduplication", "run", "twice", "get", "same", "answer", "keeps", "exactly", "one"]}, {"m": "module05", "mn": "Module 05: Dynamic Tables & Transforms", "cat": "Ingestion & Pipelines", "a": "udf", "t": "UDFs & UDTFs \u00b7 your own functions inside SQL", "s": "A user-defined function (UDF) is a function you create and then call inside any query, like a built-in: SELECT clean_phone(phone) FROM customers . A s", "tags": ["udfs", "amp", "udtfs", "own", "functions", "inside", "sql", "user-defined", "function", "udf", "you", "create"]}, {"m": "module05", "mn": "Module 05: Dynamic Tables & Transforms", "cat": "Ingestion & Pipelines", "a": "txn", "t": "Transactions & concurrency \u00b7 when two jobs write at once", "s": "A transaction is a group of statements that succeed or fail together. By default Snowflake runs in autocommit mode: every DML statement is its own tra", "tags": ["transactions", "amp", "concurrency", "two", "jobs", "write", "once", "transaction", "group", "statements", "succeed", "fail"]}, {"m": "module05", "mn": "Module 05: Dynamic Tables & Transforms", "cat": "Ingestion & Pipelines", "a": "sql", "t": "SQL lab \u00b7 click any line for an explanation", "s": "", "tags": ["sql", "lab", "any", "line", "explanation", "dynamic", "tables", "declarative", "pipelines", "incremental", "refreshes", "merge"]}, {"m": "module05", "mn": "Module 05: Dynamic Tables & Transforms", "cat": "Ingestion & Pipelines", "a": "qa", "t": "Interview Q&A \u00b7 answer out loud first, then open", "s": "", "tags": ["interview", "amp", "answer", "out", "loud", "then", "dynamic", "tables", "declarative", "pipelines", "incremental", "refreshes"]}, {"m": "module05", "mn": "Module 05: Dynamic Tables & Transforms", "cat": "Ingestion & Pipelines", "a": "quiz", "t": "Quiz \u00b7 14 questions", "s": "", "tags": ["quiz", "questions", "dynamic", "tables", "declarative", "pipelines", "incremental", "refreshes", "merge", "scd", "udfs"]}, {"m": "module05", "mn": "Module 05: Dynamic Tables & Transforms", "cat": "Ingestion & Pipelines", "a": "cheat", "t": "Cheat sheet \u00b7 if you remember only these", "s": "`; h += box(10, 10, 110, 44, 'L-st', 'RAW_ORDERS', DT.src === 'none' ? 'no new rows' : DT.src === 'burst' ? (upto { const s = st[i], x = 150 + i * 150", "tags": ["cheat", "sheet", "you", "remember", "box", "110", "l-st", "raw_orders", "src", "none", "new", "rows"]}, {"m": "module06", "mn": "Module 06: Semi-Structured Data", "cat": "Performance & SQL", "a": "intro", "t": "Messy JSON in. Clean SQL out.", "s": "APIs, event streams, mobile apps and SaaS exports rarely hand you neat CSV rows. They send JSON, Avro, Parquet or XML: nested, optional, and changing ", "tags": ["start", "here", "messy", "json", "clean", "sql", "out", "apis", "event", "streams", "mobile", "apps"]}, {"m": "module06", "mn": "Module 06: Semi-Structured Data", "cat": "Performance & SQL", "a": "shapes", "t": "Data shapes & formats \u00b7 structured, semi-structured, unstructured", "s": "Structured data fits a fixed table: every row has the same columns with the same types (a CSV of orders). Semi-structured data carries its own labels ", "tags": ["data", "shapes", "amp", "formats", "structured", "semi-structured", "unstructured", "fits", "fixed", "table", "row", "has"]}, {"m": "module06", "mn": "Module 06: Semi-Structured Data", "cat": "Performance & SQL", "a": "variant", "t": "VARIANT, OBJECT, ARRAY \u00b7 and what happens inside storage", "s": "Snowflake has three semi-structured data types:", "tags": ["variant", "object", "array", "happens", "inside", "storage", "snowflake", "has", "three", "semi-structured", "data", "types"]}, {"m": "module06", "mn": "Module 06: Semi-Structured Data", "cat": "Performance & SQL", "a": "query", "t": "Querying paths \u00b7 colon, dot, brackets, casting", "s": "To reach inside a VARIANT you write a path :", "tags": ["querying", "paths", "colon", "dot", "brackets", "casting", "reach", "inside", "variant", "you", "write", "path"]}, {"m": "module06", "mn": "Module 06: Semi-Structured Data", "cat": "Performance & SQL", "a": "flatten", "t": "FLATTEN & LATERAL \u00b7 one row with a list \u2192 many rows", "s": "FLATTEN is a table function : give it an ARRAY or OBJECT and it returns one row per element . LATERAL lets that function see the columns of the row to", "tags": ["flatten", "amp", "lateral", "one", "row", "list", "many", "rows", "table", "function", "give", "array"]}, {"m": "module06", "mn": "Module 06: Semi-Structured Data", "cat": "Performance & SQL", "a": "build", "t": "Building semi-structured data \u00b7 from rows back to JSON", "s": "The reverse of flattening: functions that create VARIANT, OBJECT and ARRAY values.", "tags": ["building", "json", "semi-structured", "data", "rows", "back", "reverse", "flattening", "functions", "create", "variant", "object"]}, {"m": "module06", "mn": "Module 06: Semi-Structured Data", "cat": "Performance & SQL", "a": "load", "t": "Loading semi-structured files \u00b7 JSON, Parquet, Avro, ORC, XML", "s": "The same COPY INTO (and Snowpipe) you know from earlier modules, with a file format of TYPE = JSON | AVRO | PARQUET | ORC | XML . Two landing styles:", "tags": ["loading", "files", "semi-structured", "json", "parquet", "avro", "orc", "xml", "same", "copy", "snowpipe", "you"]}, {"m": "module06", "mn": "Module 06: Semi-Structured Data", "cat": "Performance & SQL", "a": "perf", "t": "Performance & modeling \u00b7 query in place or promote?", "s": "Two ways to serve JSON to analysts:", "tags": ["performance", "amp", "modeling", "query", "place", "promote", "two", "ways", "serve", "json", "analysts", "variant"]}, {"m": "module06", "mn": "Module 06: Semi-Structured Data", "cat": "Performance & SQL", "a": "sql", "t": "SQL lab \u00b7 click any line for an explanation", "s": "", "tags": ["sql", "lab", "any", "line", "explanation", "variant", "object", "array", "flatten", "lateral", "querying", "json"]}, {"m": "module06", "mn": "Module 06: Semi-Structured Data", "cat": "Performance & SQL", "a": "qa", "t": "Interview Q&A \u00b7 answer out loud first, then open", "s": "", "tags": ["interview", "amp", "answer", "out", "loud", "then", "variant", "object", "array", "flatten", "lateral", "querying"]}, {"m": "module06", "mn": "Module 06: Semi-Structured Data", "cat": "Performance & SQL", "a": "quiz", "t": "Quiz \u00b7 14 questions", "s": "", "tags": ["quiz", "questions", "variant", "object", "array", "flatten", "lateral", "querying", "json", "parquet", "avro"]}, {"m": "module06", "mn": "Module 06: Semi-Structured Data", "cat": "Performance & SQL", "a": "cheat", "t": "Cheat sheet \u00b7 if you remember only these", "s": "${note}", "tags": ["cheat", "sheet", "you", "remember", "note", "variant", "object", "array", "flatten", "lateral", "querying", "json"]}, {"m": "module07", "mn": "Module 07: Data Protection & Cloning", "cat": "Storage & Governance", "a": "intro", "t": "Nothing is overwritten. So almost anything can be undone.", "s": "Module 1 taught you that Snowflake stores table data in immutable micro-partitions : files that are written once and never edited. This module shows t", "tags": ["start", "here", "data", "lifecycle", "nothing", "overwritten", "anything", "can", "undone", "module", "taught", "you"]}, {"m": "module07", "mn": "Module 07: Data Protection & Cloning", "cat": "Storage & Governance", "a": "tt", "t": "Time Travel \u00b7 query and restore the past", "s": "Time Travel lets you read, clone, or restore data as it was at an earlier point within a retention window. You use it in three ways:", "tags": ["time", "travel", "query", "restore", "past", "lets", "you", "read", "clone", "data", "was", "earlier"]}, {"m": "module07", "mn": "Module 07: Data Protection & Cloning", "cat": "Storage & Governance", "a": "fs", "t": "Fail-safe \u00b7 the last-resort safety net", "s": "Fail-safe is a fixed 7-day period that starts after Time Travel ends , for permanent tables only. During this time Snowflake still keeps the historica", "tags": ["fail-safe", "last-resort", "safety", "net", "fixed", "7-day", "period", "starts", "after", "time", "travel", "ends"]}, {"m": "module07", "mn": "Module 07: Data Protection & Cloning", "cat": "Storage & Governance", "a": "types", "t": "Table types \u00b7 permanent, transient, temporary", "s": "Snowflake has three table types that differ only in how much protection they get (and therefore how much history storage they cost). Data is stored th", "tags": ["table", "types", "permanent", "transient", "temporary", "snowflake", "has", "three", "differ", "how", "much", "protection"]}, {"m": "module07", "mn": "Module 07: Data Protection & Cloning", "cat": "Storage & Governance", "a": "clone", "t": "Zero-copy cloning \u00b7 a full copy in seconds, for free (at first)", "s": "CREATE TABLE orders_dev CLONE orders; creates a new, independent object that initially contains exactly the same data as the source, without copying a", "tags": ["zero-copy", "cloning", "full", "copy", "seconds", "free", "create", "table", "orders_dev", "clone", "orders", "creates"]}, {"m": "module07", "mn": "Module 07: Data Protection & Cloning", "cat": "Storage & Governance", "a": "repl", "t": "Replication & failover \u00b7 surviving a region outage", "s": "Replication keeps a read-only copy ( secondary ) of databases, and optionally account objects, in another Snowflake account in the same organization, ", "tags": ["replication", "amp", "failover", "surviving", "region", "outage", "keeps", "read-only", "copy", "secondary", "databases", "optionally"]}, {"m": "module07", "mn": "Module 07: Data Protection & Cloning", "cat": "Storage & Governance", "a": "backup", "t": "Backups & protection strategy \u00b7 putting it all together", "s": "Besides Time Travel, Fail-safe, clones and replication, Snowflake has added dedicated backup features: point-in-time, read-only copies of tables, sche", "tags": ["backups", "amp", "strategy", "protection", "putting", "all", "together", "besides", "time", "travel", "fail-safe", "clones"]}, {"m": "module07", "mn": "Module 07: Data Protection & Cloning", "cat": "Storage & Governance", "a": "sql", "t": "SQL lab \u00b7 click any line for an explanation", "s": "", "tags": ["sql", "lab", "any", "line", "explanation", "time", "travel", "before", "fail-safe", "zero-copy", "cloning", "cross-region"]}, {"m": "module07", "mn": "Module 07: Data Protection & Cloning", "cat": "Storage & Governance", "a": "qa", "t": "Interview Q&A \u00b7 answer out loud first, then open", "s": "", "tags": ["interview", "amp", "answer", "out", "loud", "then", "time", "travel", "before", "fail-safe", "zero-copy", "cloning"]}, {"m": "module07", "mn": "Module 07: Data Protection & Cloning", "cat": "Storage & Governance", "a": "quiz", "t": "Quiz \u00b7 14 questions", "s": "", "tags": ["quiz", "questions", "time", "travel", "before", "fail-safe", "zero-copy", "cloning", "cross-region", "failover"]}, {"m": "module07", "mn": "Module 07: Data Protection & Cloning", "cat": "Storage & Governance", "a": "cheat", "t": "Cheat sheet \u00b7 if you remember only these", "s": "0, x => x.a)}\" fill=\"var(--teal)\" fill-opacity=\".35\" stroke=\"var(--teal)\"/>`; s += ` x.a, x => x.a + x.t)}\" fill=\"var(--ice)\" fill-opacity=\".35\" strok", "tags": ["cheat", "sheet", "you", "remember", "fill", "var", "--teal", "fill-opacity", "stroke", "--ice", "strok", "time"]}, {"m": "module08", "mn": "Module 08: Security & Governance", "cat": "Storage & Governance", "a": "intro", "t": "Who are you? What may you see?", "s": "Every query in Snowflake passes through a series of checks before a single row comes back: where is it coming from, who is sending it, which role is a", "tags": ["start", "here", "who", "are", "you", "may", "see", "query", "snowflake", "passes", "through", "series"]}, {"m": "module08", "mn": "Module 08: Security & Governance", "cat": "Storage & Governance", "a": "layers", "t": "Defence in depth \u00b7 five layers, one query", "s": "Defence in depth means stacking several independent security controls so that if one fails or is misconfigured, the next one still protects the data. ", "tags": ["defence", "depth", "five", "layers", "one", "query", "means", "stacking", "several", "independent", "security", "controls"]}, {"m": "module08", "mn": "Module 08: Security & Governance", "cat": "Storage & Governance", "a": "rbac", "t": "Access control model \u00b7 roles, privileges, owners", "s": "Snowflake combines two models:", "tags": ["access", "control", "model", "roles", "privileges", "owners", "snowflake", "combines", "two", "models", "rbac", "role"]}, {"m": "module08", "mn": "Module 08: Security & Governance", "cat": "Storage & Governance", "a": "privs", "t": "Privileges in practice \u00b7 why can't I query this table?", "s": "A privilege is one permitted action on one securable object. The ones you'll use every day:", "tags": ["privileges", "practice", "why", "can", "query", "table", "privilege", "one", "permitted", "action", "securable", "object"]}, {"m": "module08", "mn": "Module 08: Security & Governance", "cat": "Storage & Governance", "a": "authn", "t": "Authentication & network \u00b7 proving who you are, and where from", "s": "Authentication answers \"are you really this user?\". Network policies answer \"are you allowed to connect from this address at all?\". Both happen before", "tags": ["authentication", "amp", "network", "proving", "who", "you", "are", "where", "answers", "really", "user", "policies"]}, {"m": "module08", "mn": "Module 08: Security & Governance", "cat": "Storage & Governance", "a": "mask", "t": "Column-level security \u00b7 dynamic data masking", "s": "A masking policy is a schema-level object containing a small SQL expression (usually a CASE ) that decides, at query time , what value a user sees in ", "tags": ["column-level", "security", "dynamic", "data", "masking", "policy", "schema-level", "object", "containing", "small", "sql", "expression"]}, {"m": "module08", "mn": "Module 08: Security & Governance", "cat": "Storage & Governance", "a": "rap", "t": "Row-level security \u00b7 row access policies", "s": "A row access policy is a schema-level object whose body returns a BOOLEAN for each row: TRUE means the row is visible, FALSE means it silently disappe", "tags": ["row-level", "security", "row", "access", "policies", "policy", "schema-level", "object", "whose", "body", "returns", "boolean"]}, {"m": "module08", "mn": "Module 08: Security & Governance", "cat": "Storage & Governance", "a": "gov", "t": "Governance & monitoring \u00b7 know your data, prove who touched it", "s": "Masking and row access policies protect data you know is sensitive. Governance answers the harder questions: where is all our PII? , who queried custo", "tags": ["governance", "amp", "monitoring", "know", "data", "prove", "who", "touched", "masking", "row", "access", "policies"]}, {"m": "module08", "mn": "Module 08: Security & Governance", "cat": "Storage & Governance", "a": "sql", "t": "SQL lab \u00b7 click any line for an explanation", "s": "", "tags": ["sql", "lab", "any", "line", "explanation", "rbac", "role", "hierarchy", "column-level", "masking", "row", "access"]}, {"m": "module08", "mn": "Module 08: Security & Governance", "cat": "Storage & Governance", "a": "qa", "t": "Interview Q&A \u00b7 answer out loud first, then open", "s": "", "tags": ["interview", "amp", "answer", "out", "loud", "then", "rbac", "role", "hierarchy", "column-level", "masking", "row"]}, {"m": "module08", "mn": "Module 08: Security & Governance", "cat": "Storage & Governance", "a": "quiz", "t": "Quiz \u00b7 14 questions", "s": "", "tags": ["quiz", "questions", "rbac", "role", "hierarchy", "column-level", "masking", "row", "access", "policies", "audit", "logging"]}, {"m": "module08", "mn": "Module 08: Security & Governance", "cat": "Storage & Governance", "a": "cheat", "t": "Cheat sheet \u00b7 if you remember only these", "s": "`; s += ` `; const cls = ['neutral', 'L-cs', 'L-cs', 'L-cp', 'L-st', 'L-st', 'neutral']; JN.forEach(([h, sub], i) => { const x = 8 + i * 108; s += ` $", "tags": ["cheat", "sheet", "you", "remember", "const", "cls", "neutral", "l-cs", "l-cp", "l-st", "foreach", "sub"]}, {"m": "module09", "mn": "Module 09: Cost & FinOps", "cat": "Architecture & Compute", "a": "intro", "t": "Every second costs. Know where it goes.", "s": "Module 1 introduced credits and warehouse sizes. This module goes much further: exactly how compute, storage and serverless features turn into a bill,", "tags": ["start", "here", "second", "costs", "know", "where", "goes", "module", "introduced", "credits", "warehouse", "sizes"]}, {"m": "module09", "mn": "Module 09: Cost & FinOps", "cat": "Architecture & Compute", "a": "buckets", "t": "The three cost buckets \u00b7 credits vs dollars", "s": "A Snowflake bill has three buckets:", "tags": ["three", "cost", "buckets", "credits", "dollars", "snowflake", "bill", "has", "warehouse", "credit", "consumption", "storage"]}, {"m": "module09", "mn": "Module 09: Cost & FinOps", "cat": "Architecture & Compute", "a": "compute", "t": "Warehouse compute \u00b7 size \u00d7 running time", "s": "A virtual warehouse is a cluster of compute nodes. It burns credits only while it is running : from the moment it starts or resumes until it suspends.", "tags": ["warehouse", "compute", "size", "running", "time", "virtual", "cluster", "nodes", "burns", "credits", "while", "moment"]}, {"m": "module09", "mn": "Module 09: Cost & FinOps", "cat": "Architecture & Compute", "a": "storage", "t": "Storage cost \u00b7 the bytes you can't see", "s": "Snowflake bills storage as the average number of compressed bytes stored per day across the month, priced per TB. It's not just your \"live\" data. The ", "tags": ["storage", "cost", "bytes", "you", "can", "see", "snowflake", "bills", "average", "number", "compressed", "stored"]}, {"m": "module09", "mn": "Module 09: Cost & FinOps", "cat": "Architecture & Compute", "a": "serverless", "t": "Serverless & cloud services \u00b7 compute you never sized", "s": "Serverless features run on compute that Snowflake provides and scales for you. There's no warehouse to size or suspend. You pay credits for the comput", "tags": ["serverless", "amp", "cloud", "services", "compute", "you", "never", "sized", "features", "run", "snowflake", "provides"]}, {"m": "module09", "mn": "Module 09: Cost & FinOps", "cat": "Architecture & Compute", "a": "guard", "t": "Guardrails \u00b7 stop the spend before finance does", "s": "Four layers of protection:", "tags": ["guardrails", "stop", "spend", "before", "finance", "does", "four", "layers", "protection", "warehouse", "credit", "consumption"]}, {"m": "module09", "mn": "Module 09: Cost & FinOps", "cat": "Architecture & Compute", "a": "visib", "t": "Visibility & attribution \u00b7 who spent what", "s": "Snowflake exposes usage through three families of views:", "tags": ["visibility", "amp", "attribution", "who", "spent", "snowflake", "exposes", "usage", "through", "three", "families", "views"]}, {"m": "module09", "mn": "Module 09: Cost & FinOps", "cat": "Architecture & Compute", "a": "playbook", "t": "Investigation playbook \u00b7 \"the bill went up 40%\"", "s": "A repeatable, top-down method for explaining a cost increase: bucket \u2192 service \u2192 warehouse \u2192 idle vs busy \u2192 workload \u2192 individual query or object . At", "tags": ["investigation", "playbook", "bill", "went", "repeatable", "top-down", "method", "explaining", "cost", "increase", "bucket", "service"]}, {"m": "module09", "mn": "Module 09: Cost & FinOps", "cat": "Architecture & Compute", "a": "sql", "t": "SQL lab \u00b7 click any line for an explanation", "s": "", "tags": ["sql", "lab", "any", "line", "explanation", "warehouse", "credit", "consumption", "storage", "costs", "serverless", "attribution"]}, {"m": "module09", "mn": "Module 09: Cost & FinOps", "cat": "Architecture & Compute", "a": "qa", "t": "Interview Q&A \u00b7 answer out loud first, then open", "s": "", "tags": ["interview", "amp", "answer", "out", "loud", "then", "warehouse", "credit", "consumption", "storage", "costs", "serverless"]}, {"m": "module09", "mn": "Module 09: Cost & FinOps", "cat": "Architecture & Compute", "a": "quiz", "t": "Quiz \u00b7 14 questions", "s": "", "tags": ["quiz", "questions", "warehouse", "credit", "consumption", "storage", "costs", "serverless", "attribution", "budget", "guardrails"]}, {"m": "module09", "mn": "Module 09: Cost & FinOps", "cat": "Architecture & Compute", "a": "cheat", "t": "Cheat sheet \u00b7 if you remember only these", "s": "`; s += ` `; s += ` `; cur.ev.forEach(e => { const p = cur.pts[e.d]; s += ` `; }); $('#rmSvg').innerHTML = s; $('#rmLog').innerHTML = cur.ev.length ? ", "tags": ["cheat", "sheet", "you", "remember", "cur", "foreach", "const", "pts", "rmsvg", "innerhtml", "rmlog", "length"]}, {"m": "module10", "mn": "Module 10: Data Sharing & Clean Rooms", "cat": "Storage & Governance", "a": "intro", "t": "Share the data. Never the copy.", "s": "Every company needs to give data to someone: a partner, a customer, a supplier, another business unit. The old way was to export a file, send it, and ", "tags": ["start", "here", "share", "data", "never", "copy", "company", "needs", "give", "someone", "partner", "customer"]}, {"m": "module10", "mn": "Module 10: Data Sharing & Clean Rooms", "cat": "Storage & Governance", "a": "share", "t": "Secure Data Sharing \u00b7 providers, consumers and the share object", "s": "Secure Data Sharing lets one Snowflake account (the provider ) give another account (the consumer ) read-only access to selected objects without copyi", "tags": ["secure", "data", "sharing", "providers", "consumers", "share", "object", "lets", "one", "snowflake", "account", "provider"]}, {"m": "module10", "mn": "Module 10: Data Sharing & Clean Rooms", "cat": "Storage & Governance", "a": "reader", "t": "Reader accounts \u00b7 sharing with someone who has no Snowflake", "s": "A reader account (also called a managed account ) is a small Snowflake account that the provider creates and owns for a consumer who isn't a Snowflake", "tags": ["reader", "accounts", "sharing", "someone", "who", "has", "snowflake", "account", "also", "called", "managed", "small"]}, {"m": "module10", "mn": "Module 10: Data Sharing & Clean Rooms", "cat": "Storage & Governance", "a": "region", "t": "Cross-region & cross-cloud \u00b7 when the consumer lives somewhere else", "s": "A Snowflake account lives in one cloud and one region , for example AWS us-east-1 or Azure West Europe. A direct share only works between accounts in ", "tags": ["cross-region", "amp", "cross-cloud", "consumer", "lives", "somewhere", "else", "snowflake", "account", "one", "cloud", "region"]}, {"m": "module10", "mn": "Module 10: Data Sharing & Clean Rooms", "cat": "Storage & Governance", "a": "listings", "t": "Listings & Marketplace \u00b7 data as a product", "s": "A listing wraps a share (or a Native App) in a product page : title, description, data dictionary, sample SQL, refresh frequency, terms of use, and op", "tags": ["listings", "amp", "marketplace", "data", "product", "listing", "wraps", "share", "native", "app", "page", "title"]}, {"m": "module10", "mn": "Module 10: Data Sharing & Clean Rooms", "cat": "Storage & Governance", "a": "cleanroom", "t": "Data Clean Rooms \u00b7 collaborate without revealing raw rows", "s": "A data clean room is a controlled environment where two or more parties can analyze their combined data (for example \"how many of my customers also sa", "tags": ["data", "clean", "rooms", "collaborate", "without", "revealing", "raw", "rows", "room", "controlled", "environment", "where"]}, {"m": "module10", "mn": "Module 10: Data Sharing & Clean Rooms", "cat": "Storage & Governance", "a": "nativeapps", "t": "Native Apps \u00b7 sharing logic, not just data", "s": "The Snowflake Native App Framework lets a provider package code plus (optionally) data into an application that consumers install inside their own Sno", "tags": ["native", "apps", "sharing", "logic", "not", "just", "data", "snowflake", "app", "framework", "lets", "provider"]}, {"m": "module10", "mn": "Module 10: Data Sharing & Clean Rooms", "cat": "Storage & Governance", "a": "gov", "t": "Governance in sharing \u00b7 who sees which rows, and for how long", "s": "Sharing doesn't switch off your security. The provider's masking policies , row access policies and secure-view filters are enforced when consumers qu", "tags": ["governance", "sharing", "who", "sees", "which", "rows", "how", "long", "doesn", "switch", "off", "security"]}, {"m": "module10", "mn": "Module 10: Data Sharing & Clean Rooms", "cat": "Storage & Governance", "a": "sql", "t": "SQL lab \u00b7 click any line for an explanation", "s": "Account names such as partner_org.partner_acct and locators such as AB12345 are placeholders. Run provider statements in the provider account and cons", "tags": ["sql", "lab", "any", "line", "explanation", "account", "names", "such", "partner_org", "partner_acct", "locators", "ab12345"]}, {"m": "module10", "mn": "Module 10: Data Sharing & Clean Rooms", "cat": "Storage & Governance", "a": "qa", "t": "Interview Q&A \u00b7 answer out loud first, then open", "s": "", "tags": ["interview", "amp", "answer", "out", "loud", "then", "direct", "shares", "reader", "accounts", "snowflake", "marketplace"]}, {"m": "module10", "mn": "Module 10: Data Sharing & Clean Rooms", "cat": "Storage & Governance", "a": "quiz", "t": "Quiz \u00b7 14 questions", "s": "", "tags": ["quiz", "questions", "direct", "shares", "reader", "accounts", "snowflake", "marketplace", "privacy-preserving", "clean", "rooms"]}, {"m": "module10", "mn": "Module 10: Data Sharing & Clean Rooms", "cat": "Storage & Governance", "a": "cheat", "t": "Cheat sheet \u00b7 if you remember only these", "s": "`; s += ` `; s += ` `; s += ` `; s += ` `; s += ` `; let mech, fresh, cost, ins, lines = ''; if (!rgHas) { mech = 'Reader account'; fresh = 'Live'; co", "tags": ["cheat", "sheet", "you", "remember", "let", "mech", "fresh", "cost", "ins", "lines", "rghas", "reader"]}, {"m": "module11", "mn": "Module 11: Snowpark, Cortex & GenAI", "cat": "Snowpark & DevOps", "a": "intro", "t": "Bring the code to the data.", "s": "The first ten modules were mostly about SQL: loading, tuning, protecting and sharing data. This module is about everything that isn't plain SQL: Pytho", "tags": ["start", "here", "bring", "code", "data", "ten", "modules", "were", "mostly", "about", "sql", "loading"]}, {"m": "module11", "mn": "Module 11: Snowpark, Cortex & GenAI", "cat": "Snowpark & DevOps", "a": "snowpark", "t": "Snowpark DataFrames \u00b7 Python that becomes SQL", "s": "Snowpark is Snowflake's developer framework for Python, Java and Scala . Its main piece is the DataFrame API : you write df.filter(...).group_by(...).", "tags": ["snowpark", "dataframes", "python", "becomes", "sql", "snowflake", "developer", "framework", "java", "scala", "its", "main"]}, {"m": "module11", "mn": "Module 11: Snowpark, Cortex & GenAI", "cat": "Snowpark & DevOps", "a": "udf", "t": "UDFs, UDTFs, vectorized UDFs & procedures \u00b7 Python on the server", "s": "When SQL alone can't express your logic, you write it in Python (or Java, Scala, JavaScript, SQL) and register it in Snowflake:", "tags": ["udfs", "udtfs", "amp", "procedures", "vectorized", "python", "server", "sql", "alone", "can", "express", "logic"]}, {"m": "module11", "mn": "Module 11: Snowpark, Cortex & GenAI", "cat": "Snowpark & DevOps", "a": "spcs", "t": "Snowpark Container Services \u00b7 your own containers inside Snowflake", "s": "Snowpark Container Services (SPCS) is a managed runtime for OCI/Docker container images inside Snowflake. You build an image with any language, librar", "tags": ["container", "services", "snowpark", "own", "containers", "inside", "snowflake", "spcs", "managed", "runtime", "oci", "docker"]}, {"m": "module11", "mn": "Module 11: Snowpark, Cortex & GenAI", "cat": "Snowpark & DevOps", "a": "cortex", "t": "Cortex AI SQL functions \u00b7 LLMs you call like SUM()", "s": "Snowflake Cortex is Snowflake's managed AI layer. Its AI SQL functions let you run large language models on table columns with plain SQL. No API keys,", "tags": ["cortex", "functions", "sql", "llms", "you", "call", "like", "sum", "snowflake", "managed", "layer", "its"]}, {"m": "module11", "mn": "Module 11: Snowpark, Cortex & GenAI", "cat": "Snowpark & DevOps", "a": "rag", "t": "Vectors & RAG \u00b7 search by meaning, answer with your data", "s": "An embedding is a list of numbers (e.g. 768 or 1024 of them) that represents the meaning of a piece of text. Texts with similar meanings get vectors t", "tags": ["vectors", "amp", "rag", "search", "meaning", "answer", "data", "embedding", "list", "numbers", "768", "1024"]}, {"m": "module11", "mn": "Module 11: Snowpark, Cortex & GenAI", "cat": "Snowpark & DevOps", "a": "analyst", "t": "Cortex Analyst & semantic models \u00b7 ask your data in English", "s": "Cortex Analyst is a managed natural-language-to-SQL service. A business user asks \"What was revenue by region last quarter?\", Analyst generates SQL ag", "tags": ["cortex", "analyst", "semantic", "models", "ask", "data", "english", "managed", "natural-language-to-sql", "service", "business", "user"]}, {"m": "module11", "mn": "Module 11: Snowpark, Cortex & GenAI", "cat": "Snowpark & DevOps", "a": "ml", "t": "Snowflake ML \u00b7 features, models and MLOps in one place", "s": "Snowflake ML is a set of tools for the whole ML lifecycle, mostly through the snowflake-ml-python library:", "tags": ["snowflake", "features", "models", "mlops", "one", "place", "set", "tools", "whole", "lifecycle", "mostly", "through"]}, {"m": "module11", "mn": "Module 11: Snowpark, Cortex & GenAI", "cat": "Snowpark & DevOps", "a": "sql", "t": "SQL / Python lab \u00b7 click any line for an explanation", "s": "Seven realistic snippets. Python lines are highlighted in amber keywords; SQL in blue. Every non-blank line has a plain-English explanation. Model nam", "tags": ["sql", "python", "lab", "any", "line", "explanation", "seven", "realistic", "snippets", "lines", "are", "highlighted"]}, {"m": "module11", "mn": "Module 11: Snowpark, Cortex & GenAI", "cat": "Snowpark & DevOps", "a": "qa", "t": "Interview Q&A \u00b7 answer out loud first, then open", "s": "", "tags": ["interview", "amp", "answer", "out", "loud", "then", "snowpark", "dataframes", "container", "services", "spcs", "cortex"]}, {"m": "module11", "mn": "Module 11: Snowpark, Cortex & GenAI", "cat": "Snowpark & DevOps", "a": "quiz", "t": "Quiz \u00b7 13 questions", "s": "", "tags": ["quiz", "questions", "snowpark", "dataframes", "container", "services", "spcs", "cortex", "llms", "vector", "search", "rag"]}, {"m": "module11", "mn": "Module 11: Snowpark, Cortex & GenAI", "cat": "Snowpark & DevOps", "a": "cheat", "t": "Cheat sheet \u00b7 if you remember only these", "s": "`; for (let i = 0; i `; } $('#vzSvg').innerHTML = h; } function vzStop() { vzT.forEach(clearTimeout); vzT = []; } function vzPlay() { vzStop(); vzDraw", "tags": ["cheat", "sheet", "you", "remember", "let", "vzsvg", "innerhtml", "function", "vzstop", "vzt", "foreach", "cleartimeout"]}, {"m": "module12", "mn": "Module 12: Advanced SQL & Execution", "cat": "Performance & SQL", "a": "intro", "t": "Think in sets. Code it live.", "s": "Every Snowflake interview for a senior developer has a live SQL round. They aren't testing whether you remember syntax. They're testing whether you ca", "tags": ["start", "here", "think", "sets", "code", "live", "snowflake", "interview", "senior", "developer", "has", "sql"]}, {"m": "module12", "mn": "Module 12: Advanced SQL & Execution", "cat": "Performance & SQL", "a": "order", "t": "How SQL executes \u00b7 the logical order of a query", "s": "You write a query starting with SELECT, but the database evaluates it in a different order. The logical order is:", "tags": ["how", "sql", "executes", "logical", "order", "query", "you", "write", "starting", "select", "but", "database"]}, {"m": "module12", "mn": "Module 12: Advanced SQL & Execution", "cat": "Performance & SQL", "a": "window", "t": "Window functions \u00b7 calculations across related rows", "s": "A window function computes a value for each row using a set of related rows, its window , without collapsing the rows. You recognise it by the OVER (.", "tags": ["window", "functions", "calculations", "across", "related", "rows", "function", "computes", "value", "each", "row", "using"]}, {"m": "module12", "mn": "Module 12: Advanced SQL & Execution", "cat": "Performance & SQL", "a": "qualify", "t": "QUALIFY \u00b7 top-N per group and deduplication", "s": "QUALIFY is a filter clause that runs after window functions are computed . It does for window functions what HAVING does for aggregates.", "tags": ["qualify", "amp", "top-n", "per", "group", "deduplication", "filter", "clause", "runs", "after", "window", "functions"]}, {"m": "module12", "mn": "Module 12: Advanced SQL & Execution", "cat": "Performance & SQL", "a": "cte", "t": "CTEs & recursive CTEs \u00b7 named steps and hierarchies", "s": "A CTE (common table expression) is a named, temporary result defined with WITH name AS (SELECT \u2026) that exists only for one statement. A recursive CTE ", "tags": ["ctes", "amp", "recursion", "recursive", "named", "steps", "hierarchies", "cte", "common", "table", "expression", "temporary"]}, {"m": "module12", "mn": "Module 12: Advanced SQL & Execution", "cat": "Performance & SQL", "a": "grouping", "t": "Grouping power \u00b7 ROLLUP, CUBE, GROUPING SETS, PIVOT", "s": "Extensions to GROUP BY that compute several groupings in one query :", "tags": ["grouping", "power", "rollup", "cube", "sets", "pivot", "extensions", "group", "compute", "several", "groupings", "one"]}, {"m": "module12", "mn": "Module 12: Advanced SQL & Execution", "cat": "Performance & SQL", "a": "joins", "t": "Special joins \u00b7 ASOF, semi/anti, self, range, lateral", "s": "Real questions are rarely plain equi-joins: \"customers who never ordered\" (anti), \"orders that had at least one return\" (semi, without duplicating ord", "tags": ["special", "joins", "asof", "semi", "anti", "self", "range", "lateral", "real", "questions", "are", "rarely"]}, {"m": "module12", "mn": "Module 12: Advanced SQL & Execution", "cat": "Performance & SQL", "a": "mr", "t": "MATCH_RECOGNIZE \u00b7 regular expressions over rows", "s": "MATCH_RECOGNIZE finds sequences of rows that match a pattern, the way a regular expression finds sequences of characters. You classify each row with a", "tags": ["match_recognize", "regular", "expressions", "over", "rows", "finds", "sequences", "match", "pattern", "way", "expression", "characters"]}, {"m": "module12", "mn": "Module 12: Advanced SQL & Execution", "cat": "Performance & SQL", "a": "problems", "t": "Classic interview problem bank \u00b7 11 problems, hints and full solutions", "s": "The 11 SQL problems that come up again and again in data engineering live-coding rounds. Each one has a problem statement , a small sample input , a h", "tags": ["problem", "bank", "classic", "interview", "problems", "hints", "full", "solutions", "sql", "come", "again", "data"]}, {"m": "module12", "mn": "Module 12: Advanced SQL & Execution", "cat": "Performance & SQL", "a": "sql", "t": "SQL lab \u00b7 click any line for an explanation", "s": "", "tags": ["sql", "lab", "any", "line", "explanation", "logical", "query", "execution", "order", "window", "functions", "qualify"]}, {"m": "module12", "mn": "Module 12: Advanced SQL & Execution", "cat": "Performance & SQL", "a": "qa", "t": "Interview Q&A \u00b7 answer out loud first, then open", "s": "", "tags": ["interview", "amp", "answer", "out", "loud", "then", "logical", "query", "execution", "order", "window", "functions"]}, {"m": "module12", "mn": "Module 12: Advanced SQL & Execution", "cat": "Performance & SQL", "a": "quiz", "t": "Quiz \u00b7 14 questions", "s": "", "tags": ["quiz", "questions", "logical", "query", "execution", "order", "window", "functions", "qualify", "ctes", "match_recognize"]}, {"m": "module12", "mn": "Module 12: Advanced SQL & Execution", "cat": "Performance & SQL", "a": "cheat", "t": "Cheat sheet \u00b7 if you remember only these", "s": "`; } }); if (RS.mode === 'up') s += ` bad data: Meera.manager = Ian `; RE.forEach(e => { const [x, y] = RPOS[e[0]], v = visits[e[0]] || 0, on = curIds", "tags": ["cheat", "sheet", "you", "remember", "mode", "bad", "data", "meera", "manager", "ian", "foreach", "const"]}, {"m": "module13", "mn": "Module 13: Data Modeling & dbt", "cat": "Snowpark & DevOps", "a": "intro", "t": "Shape the data. Ship it safely.", "s": "The previous modules taught you how Snowflake stores, loads, secures and queries data. This module is about the two things that decide whether a wareh", "tags": ["why", "modeling", "still", "matters", "shape", "data", "ship", "safely", "previous", "modules", "taught", "you"]}, {"m": "module13", "mn": "Module 13: Data Modeling & dbt", "cat": "Snowpark & DevOps", "a": "dim", "t": "Dimensional modeling \u00b7 facts, dimensions and grain", "s": "Dimensional modeling (Ralph Kimball's method) splits data into two kinds of tables:", "tags": ["dimensional", "modeling", "facts", "dimensions", "grain", "ralph", "kimball", "method", "splits", "data", "two", "kinds"]}, {"m": "module13", "mn": "Module 13: Data Modeling & dbt", "cat": "Snowpark & DevOps", "a": "scd", "t": "Slowly changing dimensions \u00b7 recap", "s": "Dimension attributes change slowly: a customer moves city, a product changes category. An SCD type is the rule for what happens to the old value.", "tags": ["slowly", "changing", "dims", "dimensions", "recap", "dimension", "attributes", "change", "customer", "moves", "city", "product"]}, {"m": "module13", "mn": "Module 13: Data Modeling & dbt", "cat": "Snowpark & DevOps", "a": "dv", "t": "Data Vault 2.0 \u00b7 hubs, links and satellites", "s": "Data Vault (Dan Linstedt) is a modeling method for the integration layer of an enterprise warehouse. It splits every source entity into three kinds of", "tags": ["data", "vault", "hubs", "links", "satellites", "dan", "linstedt", "modeling", "method", "integration", "layer", "enterprise"]}, {"m": "module13", "mn": "Module 13: Data Modeling & dbt", "cat": "Snowpark & DevOps", "a": "layers", "t": "Medallion architecture \u00b7 bronze, silver, gold in Snowflake", "s": "A layered architecture moves data through stages of increasing quality. The \"medallion\" names come from the lakehouse world; dbt projects call the sam", "tags": ["medallion", "layers", "architecture", "bronze", "silver", "gold", "snowflake", "layered", "moves", "data", "through", "stages"]}, {"m": "module13", "mn": "Module 13: Data Modeling & dbt", "cat": "Snowpark & DevOps", "a": "keys", "t": "Keys & constraints \u00b7 what Snowflake does and doesn't enforce", "s": "Snowflake lets you declare PRIMARY KEY , UNIQUE , FOREIGN KEY and NOT NULL . On standard tables, only NOT NULL is enforced . PK, UNIQUE and FK are inf", "tags": ["keys", "amp", "constraints", "snowflake", "does", "doesn", "enforce", "lets", "you", "declare", "primary", "key"]}, {"m": "module13", "mn": "Module 13: Data Modeling & dbt", "cat": "Snowpark & DevOps", "a": "dbt", "t": "dbt with Snowflake \u00b7 SQL transformations as software", "s": "dbt (data build tool) lets you write each transformation as a SELECT statement in a .sql file (a model ). dbt wraps it in the right DDL/DML (CREATE VI", "tags": ["dbt", "snowflake", "sql", "transformations", "software", "data", "build", "tool", "lets", "you", "write", "each"]}, {"m": "module13", "mn": "Module 13: Data Modeling & dbt", "cat": "Snowpark & DevOps", "a": "cicd", "t": "Orchestration & CI/CD \u00b7 run it on time, release it safely", "s": "Orchestration decides when and in what order jobs run, and what happens when one fails. CI/CD (continuous integration / delivery) decides how code cha", "tags": ["orchestration", "amp", "run", "time", "release", "safely", "decides", "order", "jobs", "happens", "one", "fails"]}, {"m": "module13", "mn": "Module 13: Data Modeling & dbt", "cat": "Snowpark & DevOps", "a": "sql", "t": "SQL lab \u00b7 click any line for an explanation", "s": "", "tags": ["sql", "lab", "any", "line", "explanation", "dimensional", "modeling", "data", "vault", "medallion", "bronze", "silver"]}, {"m": "module13", "mn": "Module 13: Data Modeling & dbt", "cat": "Snowpark & DevOps", "a": "qa", "t": "Interview Q&A \u00b7 answer out loud first, then open", "s": "", "tags": ["interview", "amp", "answer", "out", "loud", "then", "dimensional", "modeling", "data", "vault", "medallion", "bronze"]}, {"m": "module13", "mn": "Module 13: Data Modeling & dbt", "cat": "Snowpark & DevOps", "a": "quiz", "t": "Quiz \u00b7 14 questions", "s": "", "tags": ["quiz", "questions", "dimensional", "modeling", "data", "vault", "medallion", "bronze", "silver", "gold", "dbt"]}, {"m": "module13", "mn": "Module 13: Data Modeling & dbt", "cat": "Snowpark & DevOps", "a": "cheat", "t": "Cheat sheet \u00b7 if you remember only these", "s": "`; }); Object.keys(P).forEach(id => { const [x, y, w, h] = P[id], t = ST_T[id]; s += ` ${t.label} ${t.sub} `; }); $('#stSvg').innerHTML = s; $$('#stSv", "tags": ["cheat", "sheet", "you", "remember", "object", "keys", "foreach", "const", "st_t", "label", "sub", "stsvg"]}, {"m": "module14", "mn": "Module 14: Enterprise Architecture & Horizon", "cat": "Architecture & Compute", "a": "ch01", "t": "Late-arriving & out-of-order data", "s": "Events that arrive in Snowflake after the time window in which they logically belong \u2014 e.g., a mobile click event from 11:50 PM that lands in the pipe", "tags": ["late-arriving", "data", "out-of-order", "events", "arrive", "snowflake", "after", "time", "window", "which", "they", "logically"]}, {"m": "module14", "mn": "Module 14: Enterprise Architecture & Horizon", "cat": "Architecture & Compute", "a": "ch02", "t": "Multi-account enterprise strategy", "s": "Running multiple separate Snowflake accounts \u2014 typically one per environment (dev/test/prod) and sometimes one per business unit or regulatory boundar", "tags": ["multi-account", "strategy", "enterprise", "running", "multiple", "separate", "snowflake", "accounts", "typically", "one", "per", "environment"]}, {"m": "module14", "mn": "Module 14: Enterprise Architecture & Horizon", "cat": "Architecture & Compute", "a": "ch03", "t": "Private Link / Private Endpoints", "s": "A mechanism to route traffic between your VPC and Snowflake over the cloud provider's private backbone \u2014 never crossing the public internet. AWS Priva", "tags": ["private", "link", "endpoints", "mechanism", "route", "traffic", "between", "vpc", "snowflake", "over", "cloud", "provider"]}, {"m": "module14", "mn": "Module 14: Enterprise Architecture & Horizon", "cat": "Architecture & Compute", "a": "ch04", "t": "Tri-secret Compose & Customer-Managed Keys", "s": "An encryption architecture where data at rest requires both a Snowflake-managed key AND a customer-managed key (CMK) held in your own KMS (AWS KMS, Az", "tags": ["tri-secret", "compose", "customer-managed", "keys", "encryption", "architecture", "where", "data", "rest", "requires", "both", "snowflake-managed"]}, {"m": "module14", "mn": "Module 14: Enterprise Architecture & Horizon", "cat": "Architecture & Compute", "a": "ch05", "t": "Snowflake Horizon", "s": "Snowflake's built-in unified governance layer \u2014 a set of features and tools for discovering, classifying, protecting, and monitoring all data, apps, a", "tags": ["snowflake", "horizon", "built-in", "unified", "governance", "layer", "set", "features", "tools", "discovering", "classifying", "protecting"]}, {"m": "module14", "mn": "Module 14: Enterprise Architecture & Horizon", "cat": "Architecture & Compute", "a": "ch06", "t": "Object Tagging & Tag-based Policies", "s": "A metadata labelling system: you create a TAG object, apply it to any Snowflake object (database, schema, table, column, warehouse), and then policies", "tags": ["object", "tagging", "tag-based", "policies", "metadata", "labelling", "system", "you", "create", "tag", "apply", "any"]}, {"m": "module14", "mn": "Module 14: Enterprise Architecture & Horizon", "cat": "Architecture & Compute", "a": "ch07", "t": "SYSTEM$CLASSIFY \u2014 Automatic PII Detection", "s": "A Snowflake system function that uses ML models to analyze column names, data types, and sample values to automatically classify columns as containing", "tags": ["system", "classify", "automatic", "pii", "detection", "snowflake", "function", "uses", "models", "analyze", "column", "names"]}, {"m": "module14", "mn": "Module 14: Enterprise Architecture & Horizon", "cat": "Architecture & Compute", "a": "ch08", "t": "Compliance certifications", "s": "Snowflake holds SOC 2 Type II, ISO 27001, PCI-DSS (Level 1), HIPAA BAA, FedRAMP (Gov), and HITRUST certifications at the platform level. You inherit t", "tags": ["compliance", "certifications", "snowflake", "holds", "soc", "type", "iso", "27001", "pci-dss", "level", "hipaa", "baa"]}, {"m": "module14", "mn": "Module 14: Enterprise Architecture & Horizon", "cat": "Architecture & Compute", "a": "lab", "t": "Hands-on: Governance from scratch", "s": "This lab implements Object Tagging, tag-based masking, SYSTEM$CLASSIFY, and a late-arriving data MERGE on a single demo schema. You need ACCOUNTADMIN ", "tags": ["sql", "lab", "hands-on", "governance", "scratch", "implements", "object", "tagging", "tag-based", "masking", "system", "classify"]}, {"m": "module14", "mn": "Module 14: Enterprise Architecture & Horizon", "cat": "Architecture & Compute", "a": "qa", "t": "Interview Q&amp;A", "s": "", "tags": ["interview", "amp", "multi-account", "strategy", "privatelink", "tri-secret", "secure", "snowflake", "horizon", "pii", "detection"]}, {"m": "module14", "mn": "Module 14: Enterprise Architecture & Horizon", "cat": "Architecture & Compute", "a": "quiz", "t": "Quiz", "s": "1. Tri-secret Compose is available on which Snowflake edition?", "tags": ["quiz", "tri-secret", "compose", "available", "which", "snowflake", "edition", "multi-account", "strategy", "privatelink", "secure", "horizon"]}, {"m": "module14", "mn": "Module 14: Enterprise Architecture & Horizon", "cat": "Architecture & Compute", "a": "cheat", "t": "Cheat sheet", "s": "MERGE with QUALIFY ROW_NUMBER()=1 and a watermark WHERE clause (event_ts >= DATEADD('hour',-72,...)). WHEN MATCHED AND src.ts > tgt.ts THEN UPDATE to ", "tags": ["cheat", "sheet", "merge", "qualify", "row_number", "watermark", "where", "clause", "event_ts", "dateadd", "hour", "-72"]}, {"m": "module15", "mn": "Module 15: External Integrations & CDC", "cat": "Ingestion & Pipelines", "a": "ch01", "t": "Snowflake Kafka Connector", "s": "A Kafka Connect sink connector that reads records from Kafka topics and writes them to Snowflake tables using Snowpipe under the hood. Available as an", "tags": ["kafka", "connector", "snowflake", "connect", "sink", "reads", "records", "topics", "writes", "them", "tables", "using"]}, {"m": "module15", "mn": "Module 15: External Integrations & CDC", "cat": "Ingestion & Pipelines", "a": "ch02", "t": "Snowflake Spark Connector", "s": "A Spark DataSource (v2 API) that lets Apache Spark read from and write to Snowflake tables. It serialises data to Parquet, stages it in S3/ADLS/GCS, a", "tags": ["spark", "connector", "snowflake", "datasource", "api", "lets", "apache", "read", "write", "tables", "serialises", "data"]}, {"m": "module15", "mn": "Module 15: External Integrations & CDC", "cat": "Ingestion & Pipelines", "a": "ch03", "t": "CDC Pipeline: Debezium \u2192 Kafka \u2192 Snowpipe Streaming", "s": "An end-to-end change data capture (CDC) architecture that captures row-level changes from an OLTP database (MySQL, Postgres, Oracle) in real time and ", "tags": ["cdc", "debezium", "kafka", "snowpipe", "streaming", "pipeline", "end-to-end", "change", "data", "capture", "architecture", "captures"]}, {"m": "module15", "mn": "Module 15: External Integrations & CDC", "cat": "Ingestion & Pipelines", "a": "ch04", "t": "External Functions & API Integration", "s": "A mechanism to call an external REST API (via AWS API Gateway, Azure API Management, or GCP API Gateway) from within a Snowflake SQL query \u2014 as if it ", "tags": ["external", "functions", "api", "integration", "mechanism", "call", "rest", "via", "aws", "gateway", "azure", "management"]}, {"m": "module15", "mn": "Module 15: External Integrations & CDC", "cat": "Ingestion & Pipelines", "a": "lab", "t": "Hands-on: Simulate a CDC pipeline in Snowflake", "s": "This lab simulates the Debezium \u2192 Kafka \u2192 Snowflake CDC pattern entirely within Snowflake by inserting mock Debezium-shaped events and applying them w", "tags": ["sql", "lab", "hands-on", "simulate", "cdc", "pipeline", "snowflake", "simulates", "debezium", "kafka", "pattern", "entirely"]}, {"m": "module15", "mn": "Module 15: External Integrations & CDC", "cat": "Ingestion & Pipelines", "a": "qa", "t": "Interview Q&amp;A", "s": "", "tags": ["interview", "amp", "kafka", "connector", "spark", "debezium", "cdc", "pipeline", "external", "api", "integrations"]}, {"m": "module15", "mn": "Module 15: External Integrations & CDC", "cat": "Ingestion & Pipelines", "a": "quiz", "t": "Quiz", "s": "1. What authentication method does the Snowflake Kafka Connector require?", "tags": ["quiz", "authentication", "method", "does", "snowflake", "kafka", "connector", "require", "spark", "debezium", "cdc", "pipeline"]}, {"m": "module15", "mn": "Module 15: External Integrations & CDC", "cat": "Ingestion & Pipelines", "a": "cheat", "t": "Cheat sheet", "s": "Kafka topic \u2192 buffer (buffer.flush.time) \u2192 Internal Stage \u2192 Snowpipe \u2192 RECORD_CONTENT VARIANT + RECORD_METADATA VARIANT. Auth = RSA key-pair. Latency ", "tags": ["cheat", "sheet", "kafka", "topic", "buffer", "flush", "time", "internal", "stage", "snowpipe", "record_content", "variant"]}, {"m": "module16", "mn": "Module 16: IaC & DevOps Automation", "cat": "Snowpark & DevOps", "a": "ch01", "t": "Terraform for Snowflake", "s": "Using HashiCorp Terraform with the snowflake-labs/snowflake provider to define and manage Snowflake objects (warehouses, databases, schemas, roles, gr", "tags": ["terraform", "snowflake", "using", "hashicorp", "snowflake-labs", "provider", "define", "manage", "objects", "warehouses", "databases", "schemas"]}, {"m": "module16", "mn": "Module 16: IaC & DevOps Automation", "cat": "Snowpark & DevOps", "a": "ch02", "t": "Snowflake Native Git Integration", "s": "A Snowflake object ( GIT REPOSITORY ) that connects Snowflake to a GitHub, GitLab, or Bitbucket repository. Files in the repo \u2014 SQL scripts, Python sc", "tags": ["snowflake", "git", "integration", "native", "object", "repository", "connects", "github", "gitlab", "bitbucket", "files", "repo"]}, {"m": "module16", "mn": "Module 16: IaC & DevOps Automation", "cat": "Snowpark & DevOps", "a": "ch03", "t": "dbt + Airflow / Prefect / Dagster", "s": "Using an orchestrator (Airflow, Prefect, or Dagster) to schedule, sequence, and monitor dbt runs against Snowflake \u2014 combining dbt's SQL transform log", "tags": ["dbt", "airflow", "prefect", "dagster", "using", "orchestrator", "schedule", "sequence", "monitor", "runs", "against", "snowflake"]}, {"m": "module16", "mn": "Module 16: IaC & DevOps Automation", "cat": "Snowpark & DevOps", "a": "ch04", "t": "CI/CD pipelines for schema migrations", "s": "Automating the testing and deployment of Snowflake schema changes (new tables, model changes, grants, dbt model updates) through a Git-based pipeline ", "tags": ["pipelines", "schema", "migrations", "automating", "testing", "deployment", "snowflake", "changes", "new", "tables", "model", "grants"]}, {"m": "module16", "mn": "Module 16: IaC & DevOps Automation", "cat": "Snowpark & DevOps", "a": "lab", "t": "Hands-on: Terraform Snowflake objects + CI/CD flow", "s": "This lab walks through the Terraform file structure for a production Snowflake account, and the SQL steps that mirror what a CI/CD pipeline does (clon", "tags": ["lab", "terraform", "walkthrough", "hands-on", "snowflake", "objects", "flow", "walks", "through", "file", "structure", "production"]}, {"m": "module16", "mn": "Module 16: IaC & DevOps Automation", "cat": "Snowpark & DevOps", "a": "qa", "t": "Interview Q&amp;A", "s": "", "tags": ["interview", "amp", "terraform", "snowflake", "provider", "native", "git", "integration", "dbt", "cloud", "automated"]}, {"m": "module16", "mn": "Module 16: IaC & DevOps Automation", "cat": "Snowpark & DevOps", "a": "quiz", "t": "Quiz", "s": "1. Why must Terraform state files never be committed to git?", "tags": ["quiz", "why", "must", "terraform", "state", "files", "never", "committed", "git", "snowflake", "provider", "native"]}, {"m": "module16", "mn": "Module 16: IaC & DevOps Automation", "cat": "Snowpark & DevOps", "a": "cheat", "t": "Cheat sheet", "s": "snowflake-labs/snowflake provider. Resources: snowflake_warehouse, snowflake_database, snowflake_role, snowflake_grant_privileges_to_role, snowflake_r", "tags": ["cheat", "sheet", "snowflake-labs", "snowflake", "provider", "resources", "snowflake_warehouse", "snowflake_database", "snowflake_role", "snowflake_grant_privileges_to_role", "snowflake_r", "terraform"]},
{"m": "snowflake_learning_labs_FINAL.html", "mn": "Hands-On Labs: Snowsight SQL", "cat": "Architecture & Compute", "a": "architecture_dev", "t": "Lab 01: Architecture, Snowpark, UDFs and Cortex", "s": "How a query moves through cloud services, compute and storage, plus Snowpark DataFrames, UDFs, stored procedures and Cortex AI functions.", "tags": ["lab", "architecture", "snowpark", "udf", "stored procedure", "cortex", "cloud services", "warehouse"]},
{"m": "snowflake_learning_labs_FINAL.html", "mn": "Hands-On Labs: Snowsight SQL", "cat": "Architecture & Compute", "a": "micro_partitions", "t": "Lab 02: Micro-partitions, pruning and transient tables", "s": "Interactive explainer of how tables are stored, how pruning finds micro-partitions, ORDER BY, clustering keys, and transient tables.", "tags": ["lab", "micro-partitions", "pruning", "clustering", "transient"]},
{"m": "snowflake_learning_labs_FINAL.html", "mn": "Hands-On Labs: Snowsight SQL", "cat": "Architecture & Compute", "a": "mp_lab", "t": "Lab 03: Micro-partitions lab: loading, pruning and clustering", "s": "Watch tables split into micro-partitions by size, read pruning in Query Profile, test MIN/MAX filters, clustering depth and Automatic Clustering.", "tags": ["lab", "micro-partitions", "pruning", "clustering depth", "automatic clustering"]},
{"m": "snowflake_learning_labs_FINAL.html", "mn": "Hands-On Labs: Snowsight SQL", "cat": "Storage & Governance", "a": "table_types", "t": "Lab 04: Table types (Permanent, Transient, Temp, External, Dynamic, Hybrid, Iceberg, Event)", "s": "Build every kind of Snowflake table and compare protection, session visibility, external S3 tables, dynamic tables, hybrid tables, Iceberg and event tables.", "tags": ["lab", "table types", "permanent", "transient", "temporary", "external", "dynamic", "hybrid", "iceberg", "event"]},
{"m": "snowflake_learning_labs_FINAL.html", "mn": "Hands-On Labs: Snowsight SQL", "cat": "Performance & SQL", "a": "query_profile", "t": "Lab 05: Query Profile and warehouse sizing", "s": "Simulated Snowsight Query Profile: pruning, spilling, caching, exploding joins, queuing, and scaling up vs out.", "tags": ["lab", "query profile", "spilling", "queuing", "warehouse sizing"]},
{"m": "snowflake_learning_labs_FINAL.html", "mn": "Hands-On Labs: Snowsight SQL", "cat": "Performance & SQL", "a": "caching_cost", "t": "Lab 06: Caching, credits and cost controls", "s": "Result, warehouse and metadata caches, 60-second minimum credit billing, resource monitors, timeouts, and ACCOUNT_USAGE queries.", "tags": ["lab", "result cache", "credits", "resource monitors", "account_usage", "cost"]},
{"m": "snowflake_learning_labs_FINAL.html", "mn": "Hands-On Labs: Snowsight SQL", "cat": "Performance & SQL", "a": "perf_features", "t": "Lab 07: Clustering, search optimization, materialized views and query acceleration", "s": "Compare clustering keys, search optimization service, materialized views and QAS on query patterns and cost.", "tags": ["lab", "clustering", "search optimization", "materialized views", "query acceleration"]},
{"m": "snowflake_learning_labs_FINAL.html", "mn": "Hands-On Labs: Snowsight SQL", "cat": "Storage & Governance", "a": "time_travel", "t": "Lab 08: Time Travel, Fail-safe, cloning and table types", "s": "AT/BEFORE queries, UNDROP, zero-copy cloning, Fail-safe, and retention cost.", "tags": ["lab", "time travel", "undrop", "zero-copy clone", "fail-safe"]},
{"m": "snowflake_learning_labs_FINAL.html", "mn": "Hands-On Labs: Snowsight SQL", "cat": "Ingestion & Pipelines", "a": "loading", "t": "Lab 09: Loading data from S3 (stages, COPY INTO, Snowpipe and JSON)", "s": "Connect S3 via storage integration, define file formats, COPY INTO, ON_ERROR, VALIDATION_MODE, Snowpipe, VARIANT and FLATTEN.", "tags": ["lab", "s3", "stages", "copy into", "snowpipe", "variant", "flatten", "json"]},
{"m": "snowflake_learning_labs_FINAL.html", "mn": "Hands-On Labs: Snowsight SQL", "cat": "Ingestion & Pipelines", "a": "pipelines", "t": "Lab 10: Pipelines (streams, tasks, MERGE and dynamic tables)", "s": "Incremental pipelines with change tracking streams, METADATA$ columns, task graphs, MERGE, SCD Type 2 and dynamic tables.", "tags": ["lab", "streams", "tasks", "merge", "dynamic tables", "scd2"]},
{"m": "snowflake_learning_labs_FINAL.html", "mn": "Hands-On Labs: Snowsight SQL", "cat": "Performance & SQL", "a": "sql_patterns", "t": "Lab 11: SQL patterns (QUALIFY, windows, constraints, sequences)", "s": "QUALIFY, window functions, NULL traps, sequences and IDENTITY, unenforced constraints and deduplication.", "tags": ["lab", "qualify", "window functions", "constraints", "sequences", "dedup"]},
{"m": "snowflake_learning_labs_FINAL.html", "mn": "Hands-On Labs: Snowsight SQL", "cat": "Performance & SQL", "a": "star_schema", "t": "Lab 12: Star schema vs snowflake, galaxy, OBT, 3NF and Data Vault", "s": "Compare six retail schemas, join cost, SCD Type 1 and Type 2 history.", "tags": ["lab", "star schema", "scd type 2", "data vault", "one big table", "3nf"]},
{"m": "snowflake_learning_labs_FINAL.html", "mn": "Hands-On Labs: Snowsight SQL", "cat": "Storage & Governance", "a": "security", "t": "Lab 13: Access control and data governance", "s": "RBAC, role hierarchy, future grants, masking policies, row access policies, tags, secure views and network policies.", "tags": ["lab", "rbac", "masking policies", "row access policies", "secure views", "governance"]},
{"m": "snowflake_learning_labs_FINAL.html", "mn": "Hands-On Labs: Snowsight SQL", "cat": "Storage & Governance", "a": "sharing", "t": "Lab 14: Data sharing and replication", "s": "Secure Data Sharing, reader accounts, cost attribution, cross-region replication and failover.", "tags": ["lab", "data sharing", "reader accounts", "replication", "failover"]},
{"m": "snowflake_learning_labs_FINAL.html", "mn": "Hands-On Labs: Snowsight SQL", "cat": "Snowpark & DevOps", "a": "cortex_ai", "t": "Lab 15: Snowflake Cortex AI (AISQL, Search & RAG, Analyst, Agents, ML)", "s": "AI_COMPLETE, AI_CLASSIFY, AI_FILTER, AI_AGG, Cortex Search RAG, Cortex Analyst semantic YAML, Cortex Agents and ML forecasting.", "tags": ["lab", "cortex", "aisql", "complete", "rag", "cortex search", "cortex analyst", "agents", "ml"]},
{"m": "snowflake_query_backend_lab_FINAL.html", "mn": "Query Backend Lab", "cat": "Performance & SQL", "a": "", "t": "Snowflake Query Backend Lab (51 Scenarios + SQL Playground)", "s": "Step through Cloud Services, Micro-partitions, Warehouse execution and Result Cache across 51 SQL scenarios with live SQLite WASM Playground.", "tags": ["query backend", "sql playground", "qualify", "joins", "group by", "rollup", "cube", "scd2", "merge", "sessionization", "window functions", "skew"]},
{"m": "S3_Simulator_FINAL.html", "mn": "AWS S3 Simulator", "cat": "Ingestion & Pipelines", "a": "/labs", "t": "AWS S3 Console Simulator (21 Guided Labs + CloudShell + boto3 + Snowpipe)", "s": "In-browser S3 Console with buckets, IAM policies, Block Public Access, Time Machine, CloudShell CLI, boto3 SDK, and S3 to Snowflake data lake lab.", "tags": ["s3", "aws", "cloudshell", "boto3", "iam", "bucket policy", "snowpipe", "sqs", "data lake", "storage integration"]},
{"m": "SnowSQL_Streams_Tasks_Step_by_Step_Guide_FINAL.html", "mn": "Deep Dive: SnowSQL, Streams & Tasks", "cat": "Ingestion & Pipelines", "a": "", "t": "SnowSQL, Streams & Tasks — Full Step-by-Step Guide (44 steps)", "s": "Internal staging with PUT, CSV COPY INTO, standard and append-only streams, Task DAGs, nightly MERGE pipelines, schema drift and monitoring.", "tags": ["deep dive", "snowsql", "streams", "tasks", "put", "copy into", "merge", "dag", "step by step", "guide"]},
{"m": "SnowSQL_Streams_Tasks_Lab_Step_by_Step_Guide_FINAL.html", "mn": "Deep Dive: SnowSQL, Streams & Tasks", "cat": "Ingestion & Pipelines", "a": "", "t": "SnowSQL, Streams & Tasks — Lab Step-by-Step Guide (Checkpoints & Pitfalls)", "s": "Guided lab checkpoints and common pitfalls for SnowSQL PUT, internal stages, streams, tasks and MERGE.", "tags": ["deep dive", "snowsql", "streams", "tasks", "lab", "checkpoints", "pitfalls"]},
{"m": "SnowSQL_Streams_Tasks_Lab_Simulator_FINAL.html", "mn": "Deep Dive: SnowSQL, Streams & Tasks", "cat": "Ingestion & Pipelines", "a": "", "t": "SnowSQL, Streams & Tasks — Interactive Lab Simulator", "s": "Interactive terminal emulator for SnowSQL, internal stages, PUT, COPY INTO, streams and tasks.", "tags": ["deep dive", "snowsql", "streams", "tasks", "simulator", "terminal"]},
{"m": "SnowSQL_Streams_Tasks_Visual_Guide_FINAL.html", "mn": "Deep Dive: SnowSQL, Streams & Tasks", "cat": "Ingestion & Pipelines", "a": "", "t": "SnowSQL, Streams & Tasks — Visual Guide, Cheat Sheet & Quiz", "s": "Architecture diagrams, cheat sheet and self-quiz for SnowSQL, streams, tasks and MERGE pipelines.", "tags": ["deep dive", "snowsql", "streams", "tasks", "visual guide", "diagrams", "cheat sheet", "quiz"]},
{"m": "SnowSQL_Streams_Tasks_Interview_QA_FINAL.html", "mn": "Deep Dive: SnowSQL, Streams & Tasks", "cat": "Ingestion & Pipelines", "a": "", "t": "SnowSQL, Streams & Tasks — Interview Q&A (174 Questions)", "s": "174 interview questions and answers filterable by topic and difficulty for SnowSQL, streams, tasks and MERGE.", "tags": ["deep dive", "snowsql", "streams", "tasks", "interview", "qa", "questions"]},
{"m": "JSON_S3_to_Snowflake_Lab_Step_by_Step_Guide_FINAL.html", "mn": "Deep Dive: JSON S3 → Snowflake", "cat": "Ingestion & Pipelines", "a": "", "t": "JSON S3 to Snowflake — Lab Step-by-Step Guide (9 steps)", "s": "External S3 stage and IAM trust, JSON file formats, COPY INTO VARIANT, STRIP_OUTER_ARRAY, FLATTEN, LATERAL, Snowpipe auto-ingest and schema drift.", "tags": ["deep dive", "json", "s3", "snowflake", "variant", "flatten", "lateral", "snowpipe", "strip_outer_array"]},
{"m": "JSON_S3_to_Snowflake_Lab_Simulator_FINAL.html", "mn": "Deep Dive: JSON S3 → Snowflake", "cat": "Ingestion & Pipelines", "a": "", "t": "JSON S3 to Snowflake — Interactive Lab Simulator", "s": "Interactive S3 to Snowflake walkthrough for external stages, JSON file formats, COPY INTO VARIANT, FLATTEN and Snowpipe.", "tags": ["deep dive", "json", "s3", "snowflake", "simulator", "variant", "flatten", "snowpipe"]},
{"m": "JSON_S3_to_Snowflake_Visual_Guide_FINAL.html", "mn": "Deep Dive: JSON S3 → Snowflake", "cat": "Ingestion & Pipelines", "a": "", "t": "JSON S3 to Snowflake — Visual Guide, Gotchas & Cheat Sheet", "s": "Architecture diagrams, common gotchas and cheat sheet for loading semi-structured JSON from S3 into Snowflake.", "tags": ["deep dive", "json", "s3", "snowflake", "visual guide", "diagrams", "cheat sheet", "gotchas"]},
{"m": "JSON_S3_to_Snowflake_Interview_QA_FINAL.html", "mn": "Deep Dive: JSON S3 → Snowflake", "cat": "Ingestion & Pipelines", "a": "", "t": "JSON S3 to Snowflake — Interview Q&A (158 Questions)", "s": "158 interview questions and answers filterable by topic and difficulty for S3 external stages, JSON, VARIANT, FLATTEN and Snowpipe.", "tags": ["deep dive", "json", "s3", "snowflake", "interview", "qa", "questions"]}];


  // =========================================================================
  // Master Search Engine (Typo-Tolerant, Fuzzy Matching & Fallback)
  // =========================================================================
  function levenshtein(a, b) {
    const m = a.length, n = b.length;
    if (!m) return n;
    if (!n) return m;
    let prev = new Array(n + 1);
    let curr = new Array(n + 1);
    for (let j = 0; j <= n; j++) prev[j] = j;
    for (let i = 1; i <= m; i++) {
      curr[0] = i;
      const ca = a.charCodeAt(i - 1);
      for (let j = 1; j <= n; j++) {
        const cost = ca === b.charCodeAt(j - 1) ? 0 : 1;
        curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
      }
      const tmp = prev; prev = curr; curr = tmp;
    }
    return prev[n];
  }

  function wordMatchScore(qw, tw) {
    if (qw === tw) return 100;
    if (qw.length >= 3 && tw.includes(qw)) return 85;
    const qLen = qw.length, tLen = tw.length;
    if (Math.abs(qLen - tLen) > 2 || qLen <= 3 || tLen <= 3) return 0;
    const dist = levenshtein(qw, tw);
    const maxLen = Math.max(qLen, tLen);
    const similarity = 1.0 - (dist / maxLen);
    if (maxLen <= 5 && dist <= 1) return Math.floor(similarity * 90);
    if (maxLen >= 6 && dist <= 2) return Math.floor(similarity * 90);
    return 0;
  }

  function scoreTopicMatch(query, topic) {
    const qWords = query.toLowerCase().match(/[a-z0-9]+/g);
    if (!qWords || !qWords.length) return 0;

    const titleWords = (topic.t || '').toLowerCase().match(/[a-z0-9]+/g) || [];
    const tags = topic.tags || [];
    const snippetWords = (topic.s || '').toLowerCase().match(/[a-z0-9]+/g) || [];

    let totalScore = 0;
    let matchedWords = 0;

    for (const qw of qWords) {
      let bestScore = 0;
      // Title match (weight 3.0)
      for (const tw of titleWords) {
        const s = wordMatchScore(qw, tw) * 3.0;
        if (s > bestScore) bestScore = s;
      }
      // Tag match (weight 2.0)
      for (const tag of tags) {
        const tagWords = tag.toLowerCase().match(/[a-z0-9]+/g) || [];
        for (const tw of tagWords) {
          const s = wordMatchScore(qw, tw) * 2.0;
          if (s > bestScore) bestScore = s;
        }
      }
      // Snippet match (weight 1.0)
      for (const tw of snippetWords) {
        const s = wordMatchScore(qw, tw) * 1.0;
        if (s > bestScore) bestScore = s;
      }

      if (bestScore > 0) {
        totalScore += bestScore;
        matchedWords++;
      }
    }

    if (matchedWords === 0) return 0;
    if (matchedWords === qWords.length) totalScore += 50;
    return totalScore;
  }

  function resolveTopicUrl(moduleSlug, anchor) {
    const path = window.location.pathname || '';
    const currentModuleMatch = path.match(/module\d+/);
    const currentModule = currentModuleMatch ? currentModuleMatch[0] : null;

    if (moduleSlug.endsWith('.html')) {
      const target = anchor ? `${moduleSlug}#${anchor}` : moduleSlug;
      return currentModule ? '../' + target : target;
    }

    if (currentModule && currentModule === moduleSlug) {
      return '#' + anchor;
    } else if (currentModule) {
      return '../' + moduleSlug + '/#' + anchor;
    } else {
      return moduleSlug + '/#' + anchor;
    }
  }

  function getFallbackTopics(query, category) {
    let pool = COURSE_SEARCH_INDEX;
    if (category && category !== 'All') {
      pool = pool.filter(item => item.cat === category);
    }
    const preferredAnchors = ['storage', 'compute', 'cluster', 'snowpipe', 'dt', 'tt', 'rbac', 'spcs', 'cortex'];
    const candidates = pool.filter(item => preferredAnchors.includes(item.a));
    return (candidates.length >= 5 ? candidates : pool).slice(0, 5);
  }

  let activeSearchCategory = 'All';
  let activeSearchType = 'all';
  let currentSearchResults = [];
  let currentSearchSelectedIdx = 0;

  function getItemContentType(item) {
    if (!item || !item.m) return 'learning';
    if (item.m.startsWith('module')) {
      if (item.a === 'lab' || item.a === 'sql') return 'lab';
      if (item.a === 'qa' || item.a === 'quiz' || item.a === 'cheat') return 'guide';
      return 'learning';
    }
    if (item.m === 'snowflake_learning_labs_FINAL.html') {
      return ['micro_partitions', 'query_profile', 'perf_features'].includes(item.a) ? 'simulator' : 'lab';
    }
    if (item.m === 'snowflake_query_backend_lab_FINAL.html' || item.m === 'S3_Simulator_FINAL.html') return 'simulator';
    if (item.m.includes('Lab_Simulator')) return 'simulator';
    if (item.m.includes('Lab_Step_by_Step')) return 'lab';
    return 'guide';
  }

  function injectMasterSearchHTML() {
    if (document.getElementById('sf-search-backdrop')) return;

    const modalHTML = `
      <div id="sf-search-backdrop" class="sf-search-backdrop" aria-hidden="true">
        <div class="sf-search-dialog" role="dialog" aria-modal="true" aria-labelledby="sf-search-input">
          <div class="sf-search-header">
            <div class="sf-search-input-box">
              <span class="search-icon">🔍</span>
              <input type="text" id="sf-search-input" class="sf-search-input" placeholder="Search any topic, chapter, option, SQL concept across all modules..." autocomplete="off" spellcheck="false">
              <button type="button" id="sf-search-clear-btn" class="sf-search-clear-btn" title="Clear">✕</button>
            </div>
            <div class="sf-search-categories" id="sf-search-categories">
              <button type="button" class="sf-search-pill is-active" data-cat="All">All Modules</button>
              <button type="button" class="sf-search-pill" data-cat="Architecture & Compute">Architecture & Compute</button>
              <button type="button" class="sf-search-pill" data-cat="Ingestion & Pipelines">Ingestion & Pipelines</button>
              <button type="button" class="sf-search-pill" data-cat="Performance & SQL">Performance & SQL</button>
              <button type="button" class="sf-search-pill" data-cat="Storage & Governance">Storage & Governance</button>
              <button type="button" class="sf-search-pill" data-cat="Snowpark & DevOps">Snowpark & DevOps</button>
            </div>
            <div class="sf-search-categories" id="sf-search-types" style="margin-top:6px;">
              <button type="button" class="sf-search-pill is-active" data-type="all">All Types</button>
              <button type="button" class="sf-search-pill" data-type="learning">📚 Learning</button>
              <button type="button" class="sf-search-pill" data-type="lab">🧪 Labs</button>
              <button type="button" class="sf-search-pill" data-type="simulator">⚡ Simulators</button>
              <button type="button" class="sf-search-pill" data-type="guide">📖 Guides & Q&amp;A</button>
            </div>
          </div>
          <div class="sf-search-results-list" id="sf-search-results"></div>
          <div class="sf-search-footer">
            <span><kbd>↑</kbd> <kbd>↓</kbd> to navigate · <kbd>↵</kbd> to jump</span>
            <span><kbd>Esc</kbd> to close</span>
          </div>
        </div>
      </div>
    `;

    const wrapper = document.createElement('div');
    wrapper.innerHTML = modalHTML;
    document.body.appendChild(wrapper.firstElementChild);

    const backdrop = document.getElementById('sf-search-backdrop');
    const input = document.getElementById('sf-search-input');
    const clearBtn = document.getElementById('sf-search-clear-btn');
    const catContainer = document.getElementById('sf-search-categories');
    const typeContainer = document.getElementById('sf-search-types');

    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) closeMasterSearchModal();
    });

    clearBtn.addEventListener('click', () => {
      input.value = '';
      input.focus();
      runCourseSearch('', activeSearchCategory);
    });

    catContainer.addEventListener('click', (e) => {
      const pill = e.target.closest('.sf-search-pill');
      if (!pill) return;
      catContainer.querySelectorAll('.sf-search-pill').forEach(p => p.classList.remove('is-active'));
      pill.classList.add('is-active');
      activeSearchCategory = pill.dataset.cat || 'All';
      runCourseSearch(input.value.trim(), activeSearchCategory);
    });

    if (typeContainer) {
      typeContainer.addEventListener('click', (e) => {
        const pill = e.target.closest('.sf-search-pill');
        if (!pill) return;
        typeContainer.querySelectorAll('.sf-search-pill').forEach(p => p.classList.remove('is-active'));
        pill.classList.add('is-active');
        activeSearchType = pill.dataset.type || 'all';
        runCourseSearch(input.value.trim(), activeSearchCategory);
      });
    }

    input.addEventListener('input', () => {
      runCourseSearch(input.value.trim(), activeSearchCategory);
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (currentSearchResults.length > 0) {
          currentSearchSelectedIdx = (currentSearchSelectedIdx + 1) % currentSearchResults.length;
          updateSearchSelectionUI();
        }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (currentSearchResults.length > 0) {
          currentSearchSelectedIdx = (currentSearchSelectedIdx - 1 + currentSearchResults.length) % currentSearchResults.length;
          updateSearchSelectionUI();
        }
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (currentSearchResults.length > 0 && currentSearchResults[currentSearchSelectedIdx]) {
          navigateToSearchResult(currentSearchResults[currentSearchSelectedIdx]);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        closeMasterSearchModal();
      }
    });
  }

  function runCourseSearch(query, category) {
    const resultsContainer = document.getElementById('sf-search-results');
    if (!resultsContainer) return;

    currentSearchSelectedIdx = 0;
    let itemsToScore = COURSE_SEARCH_INDEX;
    if (category && category !== 'All') {
      itemsToScore = itemsToScore.filter(item => item.cat === category);
    }
    if (activeSearchType && activeSearchType !== 'all') {
      itemsToScore = itemsToScore.filter(item => getItemContentType(item) === activeSearchType);
    }

    if (!query) {
      // Default view: Show core highlights or browse list
      currentSearchResults = itemsToScore.slice(0, 15);
      renderSearchResultsHTML(currentSearchResults, false, query);
      return;
    }

    const scored = [];
    for (const item of itemsToScore) {
      const score = scoreTopicMatch(query, item);
      if (score >= 45) {
        scored.push({ score, item });
      }
    }

    scored.sort((a, b) => b.score - a.score);

    if (scored.length > 0) {
      currentSearchResults = scored.slice(0, 15).map(x => x.item);
      renderSearchResultsHTML(currentSearchResults, false, query);
    } else {
      // Fallback: No direct match found, show related topics
      const fallbackItems = getFallbackTopics(query, category);
      currentSearchResults = fallbackItems;
      renderSearchResultsHTML(currentSearchResults, true, query);
    }
  }

  function renderSearchResultsHTML(items, isFallback, query) {
    const resultsContainer = document.getElementById('sf-search-results');
    if (!resultsContainer) return;

    let html = '';
    if (isFallback) {
      html += `
        <div class="sf-search-related-banner">
          <span>💡</span>
          <div>No exact match for <strong>"${escapeHTML(query)}"</strong>. Showing related core Snowflake interview topics:</div>
        </div>
      `;
    }

    if (!items || items.length === 0) {
      resultsContainer.innerHTML = html + '<div style="padding:28px 20px;text-align:center;color:var(--ink3);">No topics available in this category.</div>';
      return;
    }

    items.forEach((item, idx) => {
      const isSelected = idx === currentSearchSelectedIdx;
      const tagBadges = (item.tags || []).slice(0, 4).map(t => `<span class="sf-search-item-tag">#${escapeHTML(t)}</span>`).join('');

      html += `
        <div class="sf-search-item ${isSelected ? 'is-selected' : ''}" data-idx="${idx}">
          <div class="sf-search-item-top">
            <span class="sf-search-item-badge">${escapeHTML(item.mn || item.m)}</span>
            <span class="sf-search-item-arrow">Jump to topic →</span>
          </div>
          <div class="sf-search-item-title">${escapeHTML(item.t)}</div>
          ${item.s ? `<div class="sf-search-item-snippet">${escapeHTML(item.s)}</div>` : ''}
          <div class="sf-search-item-tags">${tagBadges}</div>
        </div>
      `;
    });

    resultsContainer.innerHTML = html;

    resultsContainer.querySelectorAll('.sf-search-item').forEach((el) => {
      el.addEventListener('click', () => {
        const idx = parseInt(el.dataset.idx, 10);
        if (items[idx]) {
          navigateToSearchResult(items[idx]);
        }
      });
      el.addEventListener('mouseenter', () => {
        currentSearchSelectedIdx = parseInt(el.dataset.idx, 10);
        updateSearchSelectionUI();
      });
    });

    updateSearchSelectionUI();
  }

  function updateSearchSelectionUI() {
    const resultsContainer = document.getElementById('sf-search-results');
    if (!resultsContainer) return;
    const items = resultsContainer.querySelectorAll('.sf-search-item');
    items.forEach((el, idx) => {
      if (idx === currentSearchSelectedIdx) {
        el.classList.add('is-selected');
        el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      } else {
        el.classList.remove('is-selected');
      }
    });
  }

  function navigateToSearchResult(item) {
    const url = resolveTopicUrl(item.m, item.a);
    closeMasterSearchModal();

    if (url.startsWith('#')) {
      const anchorEl = document.getElementById(item.a);
      if (anchorEl) {
        anchorEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        try {
          window.history.pushState(null, '', '#' + item.a);
        } catch (e) {}
      }
    } else {
      window.location.href = url;
    }
  }

  function openMasterSearchModal(initialQuery = '') {
    injectMasterSearchHTML();
    const backdrop = document.getElementById('sf-search-backdrop');
    const input = document.getElementById('sf-search-input');
    if (!backdrop || !input) return;

    input.value = initialQuery;
    backdrop.classList.add('is-open');
    backdrop.setAttribute('aria-hidden', 'false');

    runCourseSearch(initialQuery, activeSearchCategory);
    setTimeout(() => {
      input.focus();
      if (initialQuery) input.select();
    }, 80);
  }

  function closeMasterSearchModal() {
    const backdrop = document.getElementById('sf-search-backdrop');
    if (!backdrop) return;
    backdrop.classList.remove('is-open');
    backdrop.setAttribute('aria-hidden', 'true');
  }



  // Apps Script code template shown in Google Sheet Setup tab
  const APPS_SCRIPT_TEMPLATE = `// -------------------------------------------------------------
// Snowflake Interview Lab · Google Spreadsheet Notes Backend
// Supports: Add, Edit, Delete, and Get Notes
// 1. In Google Sheets: Extensions > Apps Script
// 2. Replace all existing code with this script and Save (💾)
// 3. Click Deploy > Manage deployments > Edit (pencil icon)
// 4. Set Version: "New version", Access: "Anyone", then Deploy
// -------------------------------------------------------------

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000);
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    ensureHeader(sheet);

    var data = JSON.parse(e.postData.contents);
    var action = (data.action || "add").toLowerCase();
    var id = data.id || "";
    var timestamp = data.timestamp || new Date().toISOString();
    var topic = data.topic || "General";
    var note = data.note || "";
    var author = data.author || "Saurav Patel";

    if (action === "delete") {
      var deleted = deleteRowById(sheet, id);
      return jsonResponse({ status: "success", message: deleted ? "Note deleted" : "Note not found", id: id });
    }

    if (action === "edit") {
      var edited = editRowById(sheet, id, note, timestamp);
      if (!edited) {
        sheet.appendRow([timestamp, topic, note, author, id || Utilities.getUuid()]);
      }
      return jsonResponse({ status: "success", message: "Note updated", id: id });
    }

    // Default: add
    var newId = id || Utilities.getUuid();
    sheet.appendRow([timestamp, topic, note, author, newId]);
    return jsonResponse({ status: "success", message: "Note appended successfully", id: newId });
  } catch (err) {
    return jsonResponse({ status: "error", message: err.toString() });
  } finally {
    lock.releaseLock();
  }
}

function doGet(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    ensureHeader(sheet);

    var action = (e.parameter.action || "get").toLowerCase();
    var id = e.parameter.id || "";

    if (action === "delete" && id) {
      var lock = LockService.getScriptLock();
      lock.tryLock(5000);
      try {
        deleteRowById(sheet, id);
        return jsonResponse({ status: "success", message: "Note deleted via GET", id: id });
      } finally {
        lock.releaseLock();
      }
    }

    // Default: get notes
    var rows = sheet.getDataRange().getValues();
    if (rows.length <= 1) {
      return jsonResponse({ status: "success", notes: [] });
    }

    var filterTopic = e.parameter.topic;
    var notes = [];
    for (var i = 1; i < rows.length; i++) {
      var r = rows[i];
      if (!filterTopic || filterTopic === "all" || r[1] === filterTopic) {
        notes.push({
          timestamp: r[0],
          topic: r[1],
          note: r[2],
          author: r[3],
          id: r[4] || ("row-" + i)
        });
      }
    }
    return jsonResponse({ status: "success", notes: notes });
  } catch (err) {
    return jsonResponse({ status: "error", message: err.toString() });
  }
}

function ensureHeader(sheet) {
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(["Timestamp", "Topic", "Note", "Author", "ID"]);
    sheet.getRange(1, 1, 1, 5).setBackground("#0A86C2").setFontColor("#FFFFFF").setFontWeight("bold");
    sheet.setFrozenRows(1);
  }
}

function deleteRowById(sheet, id) {
  if (!id) return false;
  var rows = sheet.getDataRange().getValues();
  var deleted = false;
  for (var i = rows.length - 1; i >= 1; i--) {
    if (String(rows[i][4]).trim() === String(id).trim()) {
      sheet.deleteRow(i + 1);
      deleted = true;
    }
  }
  return deleted;
}

function editRowById(sheet, id, newNote, newTimestamp) {
  if (!id) return false;
  var rows = sheet.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][4]).trim() === String(id).trim()) {
      sheet.getRange(i + 1, 1).setValue(newTimestamp || new Date().toISOString());
      sheet.getRange(i + 1, 3).setValue(newNote);
      return true;
    }
  }
  return false;
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}`;

  // Current active modal topic & pending unlock action
  let currentTopic = ALL_TOPICS[0];
  let filterAllTopics = false;
  let pendingUnlockCallback = null;

  // Secure password hashing using Web Crypto API with lightweight fallback
  async function hashPassword(str) {
    if (window.crypto && window.crypto.subtle) {
      try {
        const buf = new TextEncoder().encode(str);
        const hashBuf = await window.crypto.subtle.digest('SHA-256', buf);
        return Array.from(new Uint8Array(hashBuf))
          .map((b) => b.toString(16).padStart(2, '0'))
          .join('');
      } catch (e) {
        // Fall through to fallback
      }
    }
    let h = 0x811c9dc5;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 0x01000193) >>> 0;
    }
    return 'h_' + h.toString(16);
  }

  // Local storage helpers
  function getStoredNotes() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.NOTES);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  }

  function saveStoredNotes(notes) {
    try {
      localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(notes));
      updateNotesCountBadges();
    } catch (e) {
      console.error('Failed to save notes locally', e);
    }
  }

  function getDeletedNoteIds() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.DELETED);
      return new Set(data ? JSON.parse(data) : []);
    } catch (e) {
      return new Set();
    }
  }

  function addDeletedNoteId(id) {
    if (!id) return;
    try {
      const set = getDeletedNoteIds();
      set.add(String(id).trim());
      localStorage.setItem(STORAGE_KEYS.DELETED, JSON.stringify(Array.from(set)));
    } catch (e) {}
  }

  function getGoogleSheetUrl() {
    return localStorage.getItem(STORAGE_KEYS.SHEET_URL) || DEFAULT_GOOGLE_SHEET_URL;
  }

  function setGoogleSheetUrl(url) {
    localStorage.setItem(STORAGE_KEYS.SHEET_URL, url.trim());
  }

  // Global Unlocked State (Persistent across all 16 modules and index.html)
  function isGlobalUnlocked() {
    return localStorage.getItem(STORAGE_KEYS.GLOBAL_UNLOCKED) === 'true';
  }

  // Clipboard Copy Protection (Default: blocked; unlockable with special-permission password)
  const COPY_UNLOCK_KEY = 'sf_copy_unlocked_v1';
  const COPY_PASS_SHA = 'c67b76bacce3b722211897bca5db625c3a63cb3551b496cd968ccee85694babb';
  const COPY_PASS_FNV = 'h_a8381aa5';

  function isCopyUnlocked() {
    try { return localStorage.getItem(COPY_UNLOCK_KEY) === 'true'; } catch (e) { return false; }
  }

  function setCopyUnlocked(unlocked) {
    try {
      if (unlocked) localStorage.setItem(COPY_UNLOCK_KEY, 'true');
      else localStorage.removeItem(COPY_UNLOCK_KEY);
    } catch (e) {}
  }

  function injectCopyGuardModalHTML() {
    if (document.getElementById('sf-copy-guard-backdrop')) return;
    const html = `
      <div id="sf-copy-guard-backdrop" class="sf-master-modal-backdrop" aria-hidden="true">
        <div class="sf-master-modal-dialog" role="dialog" aria-modal="true" aria-labelledby="sf-copy-guard-title">
          <div class="sf-master-modal-icon">🔒</div>
          <h3 id="sf-copy-guard-title">Copy Protected</h3>
          <p>This content is fully owned by <strong>Saurav Patel</strong> (&copy; 2026 All Rights Reserved). If you have special permission, enter the password to enable copying.</p>
          <div class="sf-form-group" style="text-align:left;">
            <input type="password" id="sf-copy-guard-input" class="sf-input" placeholder="Enter copy password..." autocomplete="off">
          </div>
          <div id="sf-copy-guard-err" class="sf-error-msg"></div>
          <div class="sf-form-actions" style="justify-content:center; margin-top:14px;">
            <button type="button" id="sf-copy-guard-cancel" class="sf-btn">Cancel</button>
            <button type="button" id="sf-copy-guard-submit" class="sf-btn sf-btn-primary">Unlock Copy</button>
          </div>
          <div style="margin-top:12px; font-size:11.5px; color:var(--ink3, #7F90A2);">
            <a href="mailto:wasteofbyte@gmail.com?subject=Snowflake%20Interview%20Lab%20-%20Copy%20Permission%20Request" style="color:var(--ice, #0A86C2); text-decoration:underline;">Request permission</a>
          </div>
        </div>
      </div>`;
    const wrap = document.createElement('div');
    wrap.innerHTML = html;
    document.body.appendChild(wrap.firstElementChild);

    const bd = document.getElementById('sf-copy-guard-backdrop');
    const inp = document.getElementById('sf-copy-guard-input');
    const err = document.getElementById('sf-copy-guard-err');
    const close = () => { bd.classList.remove('is-open'); bd.setAttribute('aria-hidden', 'true'); };

    bd.addEventListener('click', (e) => { if (e.target === bd) close(); });
    document.getElementById('sf-copy-guard-cancel').onclick = close;

    async function verifyCopyUnlock() {
      const val = (inp.value || '').trim();
      const h = await hashPassword(val);
      if (h === COPY_PASS_SHA || h === COPY_PASS_FNV) {
        setCopyUnlocked(true);
        close();
        showToast('🔓 Copying enabled! You can now copy content.');
      } else {
        err.textContent = 'Incorrect password. Content is owned by Saurav Patel.';
        inp.focus();
      }
    }

    document.getElementById('sf-copy-guard-submit').onclick = verifyCopyUnlock;
    inp.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); verifyCopyUnlock(); }
      else if (e.key === 'Escape') { e.preventDefault(); close(); }
    });
  }

  function openCopyGuardModal() {
    injectCopyGuardModalHTML();
    const bd = document.getElementById('sf-copy-guard-backdrop');
    const inp = document.getElementById('sf-copy-guard-input');
    const err = document.getElementById('sf-copy-guard-err');
    if (err) err.textContent = '';
    if (inp) inp.value = '';
    bd.classList.add('is-open');
    bd.setAttribute('aria-hidden', 'false');
    setTimeout(() => inp && inp.focus(), 40);
  }

  function isEditableTarget(el) {
    if (!el) return false;
    const tag = (el.tagName || '').toLowerCase();
    return tag === 'input' || tag === 'textarea' || !!el.isContentEditable;
  }

  function attachCopyGuard(doc) {
    if (!doc || doc.__sfCopyGuardAttached) return;
    doc.__sfCopyGuardAttached = true;

    const blockIfLocked = (e) => {
      if (isCopyUnlocked()) return;
      if (isEditableTarget(e.target)) return;
      e.preventDefault();
      e.stopPropagation();
      openCopyGuardModal();
    };

    doc.addEventListener('copy', blockIfLocked, true);
    doc.addEventListener('cut', blockIfLocked, true);
    doc.addEventListener('keydown', (e) => {
      if (isCopyUnlocked()) return;
      if ((e.metaKey || e.ctrlKey) && (e.key === 'c' || e.key === 'C' || e.key === 'x' || e.key === 'X')) {
        if (isEditableTarget(e.target)) return;
        e.preventDefault();
        e.stopPropagation();
        openCopyGuardModal();
      }
    }, true);
  }

  window.sfAttachCopyGuard = attachCopyGuard;

  function setGlobalUnlocked(unlocked) {
    if (unlocked) {
      localStorage.setItem(STORAGE_KEYS.GLOBAL_UNLOCKED, 'true');
    } else {
      localStorage.removeItem(STORAGE_KEYS.GLOBAL_UNLOCKED);
    }
    updateAllLockStates();
  }

  function updateAllLockStates() {
    updateMasterLockBtnUI();
    const sheetTab = document.getElementById('sf-tab-sheet');
    if (sheetTab) {
      sheetTab.style.display = isGlobalUnlocked() ? 'inline-block' : 'none';
    }
    refreshAllInlineNotes();
    updateNotesCountBadges();
    const notesBackdrop = document.getElementById('sf-notes-backdrop');
    if (notesBackdrop && notesBackdrop.classList.contains('is-open')) {
      renderSavedNotesView();
    }
  }

  async function verifyPassword(inputPassword) {
    const storedHash = localStorage.getItem(STORAGE_KEYS.PW_HASH);
    if (!storedHash && inputPassword === 'snowflake') {
      return true;
    }
    const inputHash = await hashPassword(inputPassword);
    const targetHash = storedHash || DEFAULT_PW_HASH;
    return inputHash === targetHash;
  }

  async function updatePassword(newPassword) {
    const newHash = await hashPassword(newPassword);
    localStorage.setItem(STORAGE_KEYS.PW_HASH, newHash);
  }

  // Sync note to Google Apps Script Web App (Supports 'add' and 'edit')
  async function syncNoteToGoogleSheet(note, action = 'add') {
    const sheetUrl = getGoogleSheetUrl();
    if (!sheetUrl) return { success: false, reason: 'No sheet URL configured' };

    try {
      const payload = JSON.stringify({
        action: action,
        timestamp: note.timestamp,
        topic: note.topic,
        note: note.text,
        author: note.author || 'Saurav Patel',
        id: note.id
      });

      // Simple Content-Type avoids CORS preflight OPTIONS block
      const response = await fetch(sheetUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: payload
      });

      if (response.ok) {
        return { success: true };
      }
      return { success: false, reason: 'HTTP ' + response.status };
    } catch (err) {
      // Fallback with no-cors so data still lands safely on Google Sheet
      try {
        await fetch(sheetUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({
            action: action,
            timestamp: note.timestamp,
            topic: note.topic,
            note: note.text,
            author: note.author || 'Saurav Patel',
            id: note.id
          })
        });
        return { success: true, opaque: true };
      } catch (err2) {
        return { success: false, reason: err2.message };
      }
    }
  }

  // Delete note from Google Apps Script Web App
  async function syncDeleteToGoogleSheet(noteId) {
    const sheetUrl = getGoogleSheetUrl();
    if (!sheetUrl || !noteId) return;

    try {
      // 1. POST delete
      fetch(sheetUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'delete',
          id: noteId
        })
      }).catch(() => {});

      // 2. GET fallback (handles redirection cleanly without CORS preflight)
      const getUrl = sheetUrl + (sheetUrl.includes('?') ? '&' : '?') + 'action=delete&id=' + encodeURIComponent(noteId);
      fetch(getUrl, { mode: 'no-cors' }).catch(() => {});
    } catch (e) {
      // Ignore background errors
    }
  }

  // Fetch notes from Google Sheet
  async function fetchNotesFromGoogleSheet(topic) {
    const sheetUrl = getGoogleSheetUrl();
    if (!sheetUrl) return { success: false, reason: 'No Google Sheet URL set' };

    try {
      const url = sheetUrl + (sheetUrl.includes('?') ? '&' : '?') + 'action=get' + (topic ? '&topic=' + encodeURIComponent(topic) : '');
      const res = await fetch(url);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const json = await res.json();
      return { success: true, notes: json.notes || [] };
    } catch (e) {
      return { success: false, reason: e.message };
    }
  }

  // Toast notification
  function showToast(message, duration = 3000) {
    let toast = document.getElementById('sf-notes-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'sf-notes-toast';
      toast.className = 'sf-toast';
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add('is-visible');
    setTimeout(() => {
      toast.classList.remove('is-visible');
    }, duration);
  }

  // =========================================================================
  // Master Password Unlock Modal (THE SINGLE PLACE TO ENTER PASSWORD)
  // =========================================================================
  function injectMasterModalsHTML() {
    if (document.getElementById('sf-master-unlock-backdrop')) return;

    const masterUnlockHTML = `
      <!-- Single Master Unlock Dialog -->
      <div id="sf-master-unlock-backdrop" class="sf-master-modal-backdrop" aria-hidden="true">
        <div class="sf-master-modal-dialog" role="dialog" aria-modal="true" aria-labelledby="sf-master-title">
          <button type="button" class="sf-notes-close-btn" id="sf-master-unlock-close" title="Close (Esc)" style="position:absolute;top:16px;right:16px;">✕</button>
          <span class="sf-master-modal-icon">🔐</span>
          <h3 id="sf-master-title">Enable Notes Across Modules</h3>
          <p id="sf-master-desc">Enter your password once to view, add, and sync notes for every topic across all 16 modules.</p>
          
          <div style="max-width:320px;margin:0 auto 16px;">
            <div style="position:relative;display:flex;align-items:center;">
              <input type="password" id="sf-master-pw-input" class="sf-input" placeholder="Enter password..." autocomplete="current-password" style="padding-right:40px;font-size:15px;text-align:center;" />
              <button type="button" id="sf-master-pw-toggle" style="position:absolute;right:8px;background:none;border:none;cursor:pointer;font-size:16px;color:var(--ink3);" title="Show/Hide Password">👁️</button>
            </div>
            <div id="sf-master-pw-error" class="sf-pw-error" style="margin-top:8px;"></div>
          </div>
          
          <div style="display:flex;gap:10px;justify-content:center;margin-bottom:14px;">
            <button type="button" class="sf-btn sf-btn-primary" id="sf-master-unlock-submit" style="padding:10px 24px;font-size:14px;font-weight:600;">
              <span>🔓 Enable Notes</span>
            </button>
            <button type="button" class="sf-btn" id="sf-master-unlock-cancel" style="padding:10px 18px;">Cancel</button>
          </div>
          
          <div class="sf-pw-hint" style="font-size:12.5px;color:var(--ink3);margin-top:14px;border-top:1px solid var(--line, rgba(11,27,43,.12));padding-top:12px;">
            Need access? <a href="mailto:wasteofbyte@gmail.com?subject=Snowflake%20Interview%20Prep%20-%20Access%20Request&body=Hi,%0D%0A%0D%0AI%20would%20like%20to%20request%20access%20to%20the%20Snowflake%20Interview%20Prep%20notes.%0D%0A%0D%0AThank%20you!" style="color:var(--ice, #0A86C2);text-decoration:underline;font-weight:600;">Ask for access</a>
          </div>
        </div>
      </div>

      <!-- Master Menu Dialog (When Notes are Unlocked) -->
      <div id="sf-master-menu-backdrop" class="sf-master-modal-backdrop" aria-hidden="true">
        <div class="sf-master-modal-dialog sf-master-menu-dialog" role="dialog" aria-modal="true" aria-labelledby="sf-menu-title">
          <div class="sf-master-menu-header">
            <div style="display:flex;align-items:center;gap:10px;">
              <span style="font-size:24px;">🔓</span>
              <div>
                <h4 id="sf-menu-title" style="margin:0;font-size:16px;font-family:var(--f-head);font-weight:700;">Notes Enabled</h4>
                <span style="font-size:11.5px;color:var(--teal);font-family:var(--f-mono);">● Active across all 16 modules</span>
              </div>
            </div>
            <button type="button" class="sf-notes-close-btn" id="sf-master-menu-close" title="Close">✕</button>
          </div>
          
          <p style="font-size:13px;color:var(--ink2);margin-bottom:16px;">
            All topic notes and revision takeaways are unlocked. Cloud sync is connected to your Google Spreadsheet.
          </p>

          <div class="sf-master-menu-list">
            <button type="button" class="sf-master-menu-item" id="sf-menu-sync-sheet-now">
              <span>↻ Sync / Pull Notes from Google Sheet</span>
              <span>☁️</span>
            </button>
            <button type="button" class="sf-master-menu-item" id="sf-menu-open-all-notes">
              <span>📝 View All Notes &amp; Summary</span>
              <span>→</span>
            </button>
            <button type="button" class="sf-master-menu-item" id="sf-menu-open-sheet-setup">
              <span>⚙️ Google Spreadsheet Setup &amp; Sync</span>
              <span>→</span>
            </button>
            <button type="button" class="sf-master-menu-item" id="sf-menu-change-pw">
              <span>🔑 Change Password</span>
              <span>→</span>
            </button>
            <button type="button" class="sf-master-menu-item danger" id="sf-menu-lock-all">
              <span>🔒 Lock Notes Across All Modules</span>
              <span>🔒</span>
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', masterUnlockHTML);
    attachMasterModalsEvents();
  }

  function attachMasterModalsEvents() {
    const unlockBackdrop = document.getElementById('sf-master-unlock-backdrop');
    const unlockClose = document.getElementById('sf-master-unlock-close');
    const unlockCancel = document.getElementById('sf-master-unlock-cancel');
    const unlockSubmit = document.getElementById('sf-master-unlock-submit');
    const pwInput = document.getElementById('sf-master-pw-input');
    const pwToggle = document.getElementById('sf-master-pw-toggle');

    const menuBackdrop = document.getElementById('sf-master-menu-backdrop');
    const menuClose = document.getElementById('sf-master-menu-close');

    // Close actions
    const closeUnlock = () => {
      unlockBackdrop.classList.remove('is-open');
      unlockBackdrop.setAttribute('aria-hidden', 'true');
      pendingUnlockCallback = null;
    };

    const closeMenu = () => {
      menuBackdrop.classList.remove('is-open');
      menuBackdrop.setAttribute('aria-hidden', 'true');
    };

    unlockClose.addEventListener('click', closeUnlock);
    unlockCancel.addEventListener('click', closeUnlock);
    unlockBackdrop.addEventListener('click', (e) => {
      if (e.target === unlockBackdrop) closeUnlock();
    });

    menuClose.addEventListener('click', closeMenu);
    menuBackdrop.addEventListener('click', (e) => {
      if (e.target === menuBackdrop) closeMenu();
    });

    // Esc key closes modals
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (unlockBackdrop.classList.contains('is-open')) closeUnlock();
        if (menuBackdrop.classList.contains('is-open')) closeMenu();
      }
    });

    // Show/hide password toggle
    pwToggle.addEventListener('click', () => {
      if (pwInput.type === 'password') {
        pwInput.type = 'text';
        pwToggle.textContent = '🔒';
      } else {
        pwInput.type = 'password';
        pwToggle.textContent = '👁️';
      }
    });

    // Submit password verification
    const handleMasterUnlockSubmit = async () => {
      const errorEl = document.getElementById('sf-master-pw-error');
      const dialog = unlockBackdrop.querySelector('.sf-master-modal-dialog');
      const entered = pwInput.value.trim();

      if (!entered) {
        errorEl.textContent = 'Please enter your password.';
        pwInput.focus();
        return;
      }

      unlockSubmit.disabled = true;
      unlockSubmit.innerHTML = '<span>Verifying...</span>';

      const isValid = await verifyPassword(entered);
      unlockSubmit.disabled = false;
      unlockSubmit.innerHTML = '<span>🔓 Enable Notes</span>';

      if (isValid) {
        setGlobalUnlocked(true);
        closeUnlock();
        showToast('🔓 Notes enabled across all modules!');
        autoSyncFromGoogleSheet(false);

        // Run pending action if user clicked an inline note
        if (typeof pendingUnlockCallback === 'function') {
          const cb = pendingUnlockCallback;
          pendingUnlockCallback = null;
          cb();
        }
      } else {
        errorEl.textContent = '❌ Incorrect password. Try again (Default: snowflake)';
        dialog.classList.add('shake');
        setTimeout(() => dialog.classList.remove('shake'), 400);
        pwInput.focus();
        pwInput.select();
      }
    };

    unlockSubmit.addEventListener('click', handleMasterUnlockSubmit);
    pwInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') handleMasterUnlockSubmit();
    });

    // Menu Actions
    const syncCloudBtn = document.getElementById('sf-menu-sync-sheet-now');
    if (syncCloudBtn) {
      syncCloudBtn.addEventListener('click', async () => {
        closeMenu();
        showToast('↻ Pulling notes from Google Sheet...');
        await autoSyncFromGoogleSheet(true);
      });
    }

    document.getElementById('sf-menu-open-all-notes').addEventListener('click', () => {
      closeMenu();
      openModal(currentTopic);
      setTimeout(() => {
        const tab = document.getElementById('sf-tab-view');
        if (tab) tab.click();
      }, 100);
    });

    document.getElementById('sf-menu-open-sheet-setup').addEventListener('click', () => {
      closeMenu();
      openModal(currentTopic);
      setTimeout(() => {
        const tab = document.querySelector('[data-tab=sheet]');
        if (tab) tab.click();
      }, 100);
    });

    document.getElementById('sf-menu-change-pw').addEventListener('click', () => {
      closeMenu();
      handleChangePasswordPrompt();
    });

    document.getElementById('sf-menu-lock-all').addEventListener('click', () => {
      closeMenu();
      setGlobalUnlocked(false);
      showToast('🔒 Notes locked across all modules.');
    });
  }

  // Open the Single Master Unlock Modal
  function openMasterUnlockModal(pendingAction = null) {
    injectMasterModalsHTML();
    pendingUnlockCallback = pendingAction;

    const backdrop = document.getElementById('sf-master-unlock-backdrop');
    const pwInput = document.getElementById('sf-master-pw-input');
    const pwError = document.getElementById('sf-master-pw-error');

    pwInput.value = '';
    pwInput.type = 'password';
    document.getElementById('sf-master-pw-toggle').textContent = '👁️';
    pwError.textContent = '';

    backdrop.classList.add('is-open');
    backdrop.setAttribute('aria-hidden', 'false');

    setTimeout(() => pwInput.focus(), 120);
  }

  // Open Master Menu when already unlocked
  function openMasterMenuModal() {
    injectMasterModalsHTML();
    const backdrop = document.getElementById('sf-master-menu-backdrop');
    backdrop.classList.add('is-open');
    backdrop.setAttribute('aria-hidden', 'false');
  }

  // =========================================================================
  // Top Nav Master Lock/Unlock Button Management
  // =========================================================================
  function initMasterTopNavButton() {
    const navContainer = document.querySelector('.top, .topbar, #sfNotesMount');
    if (!navContainer) return;

    const themeBtn = navContainer.querySelector('.theme, #themeBtn, [onclick*="toggleTheme"]');

    // 1. Master Search Button
    let searchBtn = document.getElementById('sfMasterSearchBtn');
    if (!searchBtn) {
      searchBtn = document.createElement('button');
      searchBtn.type = 'button';
      searchBtn.id = 'sfMasterSearchBtn';
      searchBtn.className = 'top-notes-nav-btn sf-master-search-btn';
      searchBtn.title = 'Search all Snowflake interview topics (⌘K / Ctrl+K)';
      searchBtn.innerHTML = '<span>🔍 Search</span> <kbd>⌘K</kbd>';
      if (themeBtn) {
        navContainer.insertBefore(searchBtn, themeBtn);
      } else {
        navContainer.appendChild(searchBtn);
      }
    }
    searchBtn.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      openMasterSearchModal();
    };

    // 2. Master Lock / Unlock Button
    let lockBtn = document.getElementById('sfMasterLockBtn');
    if (!lockBtn) {
      lockBtn = document.createElement('button');
      lockBtn.type = 'button';
      lockBtn.id = 'sfMasterLockBtn';
      if (themeBtn) {
        navContainer.insertBefore(lockBtn, themeBtn);
      } else {
        navContainer.appendChild(lockBtn);
      }
    }

    updateMasterLockBtnUI(lockBtn);

    lockBtn.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (isGlobalUnlocked()) {
        openMasterMenuModal();
      } else {
        openMasterUnlockModal();
      }
    };
  }

  function updateMasterLockBtnUI(btn) {
    if (!btn) btn = document.getElementById('sfMasterLockBtn');
    if (!btn) return;

    const unlocked = isGlobalUnlocked();
    if (unlocked) {
      btn.className = 'top-notes-nav-btn sf-master-lock-btn unlocked';
      btn.innerHTML = '<span>🔓 Notes Enabled</span>';
      btn.title = 'Notes are unlocked across all modules. Click for options.';
    } else {
      btn.className = 'top-notes-nav-btn sf-master-lock-btn locked';
      btn.innerHTML = '<span>🔒 Enable Notes</span>';
      btn.title = 'Click to enter password and enable notes across all modules.';
    }
  }

  // =========================================================================
  // Main Notes Modal (Add, View, Google Sheet Setup)
  // =========================================================================
  function injectModalHTML() {
    if (document.getElementById('sf-notes-backdrop')) return;

    const modalHTML = `
      <div id="sf-notes-backdrop" class="sf-notes-backdrop" aria-hidden="true">
        <div class="sf-notes-modal" role="dialog" aria-modal="true" aria-labelledby="sf-modal-title">
          
          <!-- Header -->
          <div class="sf-notes-header">
            <div class="sf-notes-title-group">
              <h3 id="sf-modal-title">📝 Topic Notes</h3>
              <p id="sf-modal-subtitle">Snowflake Interview Lab · Cloud Sheet Sync</p>
            </div>
            <button type="button" class="sf-notes-close-btn" id="sf-notes-close-btn" title="Close (Esc)">✕</button>
          </div>

          <!-- Tabs -->
          <div class="sf-notes-tabs">
            <button type="button" class="sf-notes-tab is-active" data-tab="add">➕ Add Note</button>
            <button type="button" class="sf-notes-tab" data-tab="view" id="sf-tab-view">Saved Notes</button>
            <button type="button" class="sf-notes-tab" data-tab="sheet" id="sf-tab-sheet" style="display: none;">⚙️ Google Sheet Setup</button>
          </div>

          <!-- Body -->
          <div class="sf-notes-body">
            
            <!-- Pane 1: Add Note -->
            <div class="sf-pane is-active" id="sf-pane-add">
              <div class="sf-form-group">
                <label class="sf-form-label" for="sf-note-topic">TOPIC / MODULE</label>
                <select id="sf-note-topic" class="sf-topic-select">
                  ${ALL_TOPICS.map((t) => `<option value="${t}">${t}</option>`).join('')}
                </select>
              </div>

              <div class="sf-form-group">
                <label class="sf-form-label" for="sf-note-text">YOUR NOTE / INTERVIEW REVISION POINT</label>
                <textarea id="sf-note-text" class="sf-textarea" placeholder="Write key formulas, Gotchas, SQL snippets, or mental shortcuts for this topic..."></textarea>
              </div>

              <div class="sf-form-actions">
                <div>
                  <span id="sf-sync-status-badge" class="sf-status-badge synced">🟢 Synced to Google Sheet</span>
                </div>
                <div style="display:flex;gap:8px;">
                  <button type="button" class="sf-btn sf-btn-primary" id="sf-save-note-btn">
                    <span>💾 Save Note</span>
                  </button>
                </div>
              </div>
            </div>

            <!-- Pane 2: View Saved Notes -->
            <div class="sf-pane" id="sf-pane-view">
              
              <!-- Locked State (Single Master Unlock Trigger) -->
              <div id="sf-view-locked" class="sf-locked-box" style="display:none;">
                <span class="sf-lock-icon">🔒</span>
                <h4>Notes are Locked</h4>
                <p>Enter your password to enable and review your saved notes across all topics.</p>
                <button type="button" class="sf-btn sf-btn-primary" id="sf-modal-unlock-trigger" style="margin-top:10px;padding:8px 20px;">
                  🔑 Enter Password to Enable Notes
                </button>
                <div style="font-size:12.5px;color:var(--ink3);margin-top:14px;border-top:1px solid var(--line, rgba(11,27,43,.12));padding-top:12px;">
                  Need access? <a href="mailto:wasteofbyte@gmail.com?subject=Snowflake%20Interview%20Prep%20-%20Access%20Request&body=Hi,%0D%0A%0D%0AI%20would%20like%20to%20request%20access%20to%20the%20Snowflake%20Interview%20Prep%20notes.%0D%0A%0D%0AThank%20you!" style="color:var(--ice, #0A86C2);text-decoration:underline;font-weight:600;">Ask for access</a>
                </div>
              </div>

              <!-- Unlocked State -->
              <div id="sf-view-unlocked" style="display:none;">
                <div class="sf-unlocked-toolbar">
                  <div class="sf-filter-group">
                    <button type="button" class="sf-pill-btn is-active" id="sf-filter-topic-btn">This Topic</button>
                    <button type="button" class="sf-pill-btn" id="sf-filter-all-btn">All Topics</button>
                  </div>
                  <div style="display:flex;gap:6px;align-items:center;">
                    <button type="button" class="sf-btn sf-btn-sm" id="sf-refresh-sheet-btn" title="Refresh & pull from Google Sheet">↻ Sync Sheet</button>
                    <button type="button" class="sf-btn sf-btn-sm" id="sf-change-pw-btn" title="Change note password">🔑 Change Password</button>
                    <button type="button" class="sf-btn sf-btn-sm" id="sf-lock-again-btn" title="Lock notes view again">🔒 Lock</button>
                  </div>
                </div>

                <!-- Notes list -->
                <div id="sf-notes-list" class="sf-notes-list"></div>

                <div class="sf-form-actions" style="margin-top:16px;">
                  <span id="sf-total-notes-count" style="font-size:12px;color:var(--ink3);font-family:var(--f-mono);">0 notes</span>
                  <button type="button" class="sf-btn sf-btn-sm" id="sf-export-csv-btn">📥 Export to CSV</button>
                </div>
              </div>

            </div>

            <!-- Pane 3: Google Sheet Setup -->
            <div class="sf-pane" id="sf-pane-sheet">
              <div class="sf-sheet-step">
                <h5>1. Active Google Spreadsheet Integration</h5>
                <p>Notes are automatically sent to your connected Google Sheet Web App:</p>
                <div class="sf-form-group">
                  <input type="url" id="sf-sheet-url-input" class="sf-input" placeholder="https://script.google.com/macros/s/.../exec" />
                </div>
                <div style="display:flex;gap:8px;margin-top:8px;">
                  <button type="button" class="sf-btn sf-btn-primary" id="sf-save-sheet-url-btn">Save &amp; Test Connection</button>
                  <button type="button" class="sf-btn" id="sf-sync-all-notes-btn">☁️ Sync All Unsynced Notes</button>
                </div>
                <div id="sf-sheet-conn-status" style="margin-top:8px;font-size:12.5px;font-family:var(--f-mono);"></div>
              </div>

              <div class="sf-sheet-step">
                <h5>2. Google Apps Script Code (Reference)</h5>
                <p>If configuring a new spreadsheet, paste this in <b>Extensions &gt; Apps Script</b> and deploy as Web App (Access: Anyone):</p>
                <div class="sf-code-container">
                  <button type="button" class="sf-copy-code-btn" id="sf-copy-code-btn">📋 Copy Code</button>
                  <pre class="sf-code-box" id="sf-apps-script-code">${APPS_SCRIPT_TEMPLATE}</pre>
                </div>
              </div>
            </div>

          </div>

        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
    attachModalEvents();
  }

  function attachModalEvents() {
    const backdrop = document.getElementById('sf-notes-backdrop');
    const closeBtn = document.getElementById('sf-notes-close-btn');
    const tabs = document.querySelectorAll('.sf-notes-tab');
    const panes = document.querySelectorAll('.sf-pane');

    // Close on X
    closeBtn.addEventListener('click', closeModal);

    // Close on backdrop click outside modal
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) closeModal();
    });

    // Close on Esc key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && backdrop.classList.contains('is-open')) {
        closeModal();
      }
    });

    // Tab switching
    tabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        if (tab.dataset.tab === 'sheet' && !isGlobalUnlocked()) {
          openMasterUnlockModal(() => {
            tab.click();
          });
          return;
        }
        tabs.forEach((t) => t.classList.remove('is-active'));
        panes.forEach((p) => p.classList.remove('is-active'));

        tab.classList.add('is-active');
        const targetPane = document.getElementById('sf-pane-' + tab.dataset.tab);
        if (targetPane) targetPane.classList.add('is-active');

        if (tab.dataset.tab === 'view') {
          renderSavedNotesView();
        } else if (tab.dataset.tab === 'sheet') {
          document.getElementById('sf-sheet-url-input').value = getGoogleSheetUrl();
        }
      });
    });

    // Save Note Button
    document.getElementById('sf-save-note-btn').addEventListener('click', handleSaveNote);

    // Master unlock trigger inside modal View pane
    const modalUnlockTrigger = document.getElementById('sf-modal-unlock-trigger');
    if (modalUnlockTrigger) {
      modalUnlockTrigger.addEventListener('click', () => {
        openMasterUnlockModal(() => {
          renderSavedNotesView();
        });
      });
    }

    // Lock again
    document.getElementById('sf-lock-again-btn').addEventListener('click', () => {
      setGlobalUnlocked(false);
      renderSavedNotesView();
      showToast('🔒 Notes locked.');
    });

    // Filter toggles
    document.getElementById('sf-filter-topic-btn').addEventListener('click', () => {
      filterAllTopics = false;
      document.getElementById('sf-filter-topic-btn').classList.add('is-active');
      document.getElementById('sf-filter-all-btn').classList.remove('is-active');
      renderNotesList();
    });

    document.getElementById('sf-filter-all-btn').addEventListener('click', () => {
      filterAllTopics = true;
      document.getElementById('sf-filter-all-btn').classList.add('is-active');
      document.getElementById('sf-filter-topic-btn').classList.remove('is-active');
      renderNotesList();
    });

    // Change Password
    document.getElementById('sf-change-pw-btn').addEventListener('click', handleChangePasswordPrompt);

    // Refresh from Google Sheet
    document.getElementById('sf-refresh-sheet-btn').addEventListener('click', handleRefreshFromSheet);

    // Copy Apps Script code
    document.getElementById('sf-copy-code-btn').addEventListener('click', () => {
      navigator.clipboard.writeText(APPS_SCRIPT_TEMPLATE).then(() => {
        showToast('📋 Code copied to clipboard!');
      });
    });

    // Save Google Sheet URL
    document.getElementById('sf-save-sheet-url-btn').addEventListener('click', handleSaveSheetUrl);

    // Sync all unsynced notes button
    document.getElementById('sf-sync-all-notes-btn').addEventListener('click', handleSyncAllNotes);

    // Export to CSV
    document.getElementById('sf-export-csv-btn').addEventListener('click', handleExportCSV);
  }

  // Open modal
  function openModal(topicName) {
    injectModalHTML();

    if (topicName) {
      currentTopic = topicName;
      const select = document.getElementById('sf-note-topic');
      if (select) {
        let found = false;
        for (let i = 0; i < select.options.length; i++) {
          if (select.options[i].value === topicName) {
            select.selectedIndex = i;
            found = true;
            break;
          }
        }
        if (!found) {
          const opt = document.createElement('option');
          opt.value = topicName;
          opt.textContent = topicName;
          select.appendChild(opt);
          select.value = topicName;
        }
      }
    }

    document.getElementById('sf-modal-title').textContent = `📝 Notes · ${currentTopic}`;
    document.getElementById('sf-filter-topic-btn').textContent = currentTopic.split(':')[0] || 'This Topic';

    updateSyncStatusBadge();
    document.getElementById('sf-note-text').value = '';

    const backdrop = document.getElementById('sf-notes-backdrop');
    backdrop.classList.add('is-open');
    backdrop.setAttribute('aria-hidden', 'false');

    setTimeout(() => {
      const activeTab = document.querySelector('.sf-notes-tab.is-active');
      if (activeTab && activeTab.dataset.tab === 'add') {
        document.getElementById('sf-note-text').focus();
      } else if (activeTab && activeTab.dataset.tab === 'view') {
        renderSavedNotesView();
      }
    }, 100);
  }

  // Close modal
  function closeModal() {
    const backdrop = document.getElementById('sf-notes-backdrop');
    if (backdrop) {
      backdrop.classList.remove('is-open');
      backdrop.setAttribute('aria-hidden', 'true');
    }
  }

  function updateSyncStatusBadge() {
    const badge = document.getElementById('sf-sync-status-badge');
    const sheetUrl = getGoogleSheetUrl();
    if (badge) {
      if (sheetUrl) {
        badge.className = 'sf-status-badge synced';
        badge.innerHTML = '🟢 Synced to Google Sheet';
      } else {
        badge.className = 'sf-status-badge local';
        badge.innerHTML = '💾 Saved Locally (Sheet not linked)';
      }
    }
  }

  // Handle saving a note
  async function handleSaveNote() {
    const topicSelect = document.getElementById('sf-note-topic');
    const noteTextarea = document.getElementById('sf-note-text');
    const saveBtn = document.getElementById('sf-save-note-btn');

    const topic = topicSelect.value.trim();
    const text = noteTextarea.value.trim();

    if (!text) {
      showToast('⚠️ Please enter a note before saving.');
      noteTextarea.focus();
      return;
    }

    saveBtn.disabled = true;
    saveBtn.innerHTML = '<span>⏳ Saving...</span>';

    const newNote = {
      id: 'note_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      topic: topic,
      text: text,
      timestamp: new Date().toISOString(),
      author: 'Saurav Patel',
      synced: false
    };

    const notes = getStoredNotes();
    notes.unshift(newNote);
    saveStoredNotes(notes);

    // Auto-enable notes when adding a note
    setGlobalUnlocked(true);

    const sheetUrl = getGoogleSheetUrl();
    if (sheetUrl) {
      const syncRes = await syncNoteToGoogleSheet(newNote);
      if (syncRes.success) {
        newNote.synced = true;
        saveStoredNotes(notes);
        showToast('✅ Note saved and synced to Google Sheet!');
      } else {
        showToast('💾 Note saved locally (Google Sheet sync failed: ' + (syncRes.reason || 'check URL') + ')');
      }
    } else {
      showToast('💾 Note saved locally! (Tip: Link Google Sheet in ⚙️ tab to auto-sync)');
    }

    noteTextarea.value = '';
    saveBtn.disabled = false;
    saveBtn.innerHTML = '<span>💾 Save Note</span>';

    document.getElementById('sf-tab-view').click();
  }

  // Render Saved Notes view depending on locked/unlocked state
  function renderSavedNotesView() {
    const isUnlocked = isGlobalUnlocked();
    const lockedBox = document.getElementById('sf-view-locked');
    const unlockedBox = document.getElementById('sf-view-unlocked');

    if (!isUnlocked) {
      if (lockedBox) lockedBox.style.display = 'block';
      if (unlockedBox) unlockedBox.style.display = 'none';
    } else {
      if (lockedBox) lockedBox.style.display = 'none';
      if (unlockedBox) unlockedBox.style.display = 'block';
      renderNotesList();
    }
  }

  // Render notes cards list
  function renderNotesList() {
    const listContainer = document.getElementById('sf-notes-list');
    const totalCountEl = document.getElementById('sf-total-notes-count');
    const allNotes = getStoredNotes();

    const filtered = filterAllTopics
      ? allNotes
      : allNotes.filter((n) => n.topic === currentTopic);

    totalCountEl.textContent = `${filtered.length} ${filtered.length === 1 ? 'note' : 'notes'} (${filterAllTopics ? 'All topics' : currentTopic})`;

    if (filtered.length === 0) {
      listContainer.innerHTML = `
        <div class="sf-empty-notes">
          No notes recorded yet for ${filterAllTopics ? 'any topic' : `<b>${escapeHTML(currentTopic)}</b>`}.<br>
          Click <b>➕ Add Note</b> above or the <b>📝 Note</b> button next to any topic tag to save a revision point!
        </div>
      `;
      return;
    }

    listContainer.innerHTML = filtered
      .map((note) => {
        const dateStr = new Date(note.timestamp).toLocaleString(undefined, {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });

        const syncBadge = note.synced
          ? '<span class="sf-status-badge synced" style="font-size:10px;padding:1px 6px;">☁️ Synced</span>'
          : '<span class="sf-status-badge local" style="font-size:10px;padding:1px 6px;">💾 Local</span>';

        return `
          <div class="sf-note-card" data-id="${note.id}">
            <div class="sf-note-header">
              <span class="sf-note-topic-tag">${escapeHTML(note.topic)}</span>
              <div style="display:flex;align-items:center;gap:6px;">
                ${syncBadge}
                <span class="sf-note-date">${dateStr}</span>
              </div>
            </div>
            <div class="sf-note-content">${escapeHTML(note.text)}</div>
            <div class="sf-note-footer">
              <span style="font-size:11px;color:var(--ink3);font-family:var(--f-mono);">👤 ${escapeHTML(note.author || 'Saurav Patel')}</span>
              <div class="sf-note-actions">
                <button type="button" class="sf-icon-btn copy-btn" title="Copy note text">📋 Copy</button>
                <button type="button" class="sf-icon-btn danger delete-btn" title="Delete note">🗑️ Delete</button>
              </div>
            </div>
          </div>
        `;
      })
      .join('');

    // Attach copy & delete handlers
    listContainer.querySelectorAll('.copy-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const card = e.target.closest('.sf-note-card');
        const text = card.querySelector('.sf-note-content').textContent;
        navigator.clipboard.writeText(text).then(() => showToast('📋 Copied to clipboard!'));
      });
    });

    listContainer.querySelectorAll('.delete-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const card = e.target.closest('.sf-note-card');
        const noteId = card.dataset.id;
        if (confirm('Delete this note?')) {
          deleteNote(noteId);
        }
      });
    });
  }

  function deleteNote(noteId) {
    if (!noteId) return;

    // 1. Mark as tombstoned so auto-sync never restores it
    addDeletedNoteId(noteId);

    // 2. Remove locally
    let notes = getStoredNotes();
    notes = notes.filter((n) => n.id !== noteId);
    saveStoredNotes(notes);
    renderNotesList();
    refreshAllInlineNotes();
    updateNotesCountBadges();
    showToast('🗑️ Note deleted.');

    // 3. Sync deletion to Google Sheet
    syncDeleteToGoogleSheet(noteId);
  }

  async function handleChangePasswordPrompt() {
    const current = prompt('Enter current password:');
    if (current === null) return;

    const isCurrentValid = await verifyPassword(current);
    if (!isCurrentValid) {
      alert('Current password is incorrect.');
      return;
    }

    const newPw = prompt('Enter new password (at least 4 characters):');
    if (!newPw) return;
    if (newPw.trim().length < 4) {
      alert('Password must be at least 4 characters.');
      return;
    }

    const confirmPw = prompt('Confirm new password:');
    if (newPw !== confirmPw) {
      alert('Passwords do not match.');
      return;
    }

    await updatePassword(newPw);
    showToast('🔑 Password updated successfully!');
  }

  async function handleSaveSheetUrl() {
    const input = document.getElementById('sf-sheet-url-input');
    const statusEl = document.getElementById('sf-sheet-conn-status');
    const url = input.value.trim();

    if (!url) {
      setGoogleSheetUrl('');
      statusEl.style.color = 'var(--ink2)';
      statusEl.textContent = 'Cleared Google Sheet URL. Notes will save locally.';
      updateSyncStatusBadge();
      return;
    }

    statusEl.style.color = 'var(--ice)';
    statusEl.textContent = 'Testing connection to Google Sheet...';

    setGoogleSheetUrl(url);
    updateSyncStatusBadge();

    try {
      const res = await fetch(url + (url.includes('?') ? '&' : '?') + 'action=get');
      if (res.ok) {
        statusEl.style.color = 'var(--teal)';
        statusEl.textContent = '✅ Connected successfully! Google Spreadsheet is ready.';
        showToast('✅ Google Sheet connected!');
      } else {
        statusEl.style.color = 'var(--amber)';
        statusEl.textContent = `⚠️ URL saved. (HTTP status: ${res.status}. Ensure "Who has access" is set to "Anyone").`;
      }
    } catch (err) {
      statusEl.style.color = 'var(--amber)';
      statusEl.textContent = '⚠️ URL saved. Test ping had CORS restrictions, but submissions will send via Web App mode.';
    }
  }

  async function handleSyncAllNotes() {
    const sheetUrl = getGoogleSheetUrl();
    if (!sheetUrl) {
      alert('Please save your Google Apps Script Web App URL first.');
      return;
    }

    const notes = getStoredNotes();
    const unsynced = notes.filter((n) => !n.synced);

    if (unsynced.length === 0) {
      showToast('All notes are already synced to Google Sheet!');
      return;
    }

    const syncBtn = document.getElementById('sf-sync-all-notes-btn');
    syncBtn.disabled = true;
    syncBtn.textContent = `Syncing ${unsynced.length} notes...`;

    let successCount = 0;
    for (const note of unsynced) {
      const res = await syncNoteToGoogleSheet(note);
      if (res.success) {
        note.synced = true;
        successCount++;
      }
    }

    saveStoredNotes(notes);
    syncBtn.disabled = false;
    syncBtn.textContent = '☁️ Sync All Unsynced Notes';

    showToast(`✅ Synced ${successCount} notes to Google Sheet!`);
    if (document.getElementById('sf-pane-view').classList.contains('is-active')) {
      renderNotesList();
    }
  }

  async function handleRefreshFromSheet() {
    const sheetUrl = getGoogleSheetUrl();
    if (!sheetUrl) {
      alert('Google Sheet URL is not configured. Go to ⚙️ Google Sheet Setup to connect.');
      return;
    }

    const refreshBtn = document.getElementById('sf-refresh-sheet-btn');
    refreshBtn.disabled = true;
    refreshBtn.textContent = '↻ Syncing...';

    const res = await fetchNotesFromGoogleSheet(filterAllTopics ? '' : currentTopic);
    refreshBtn.disabled = false;
    refreshBtn.textContent = '↻ Sync Sheet';

    if (res.success && res.notes) {
      const localNotes = getStoredNotes();
      let added = 0;

      res.notes.forEach((remote) => {
        const exists = localNotes.some((l) => l.id === remote.id || (l.timestamp === remote.timestamp && l.text === remote.note));
        if (!exists) {
          localNotes.unshift({
            id: remote.id || 'remote_' + Date.now(),
            topic: remote.topic || currentTopic,
            text: remote.note,
            timestamp: remote.timestamp || new Date().toISOString(),
            author: remote.author || 'Saurav Patel',
            synced: true
          });
          added++;
        }
      });

      saveStoredNotes(localNotes);
      renderNotesList();
      showToast(`Pulled ${added} new notes from Google Sheet!`);
    } else {
      showToast('⚠️ Could not pull from sheet: ' + (res.reason || 'Network error'));
    }
  }

  // Automatic background pull & merge from Google Spreadsheet (Handles Edits & Deletions)
  async function autoSyncFromGoogleSheet(showFeedback = false) {
    const sheetUrl = getGoogleSheetUrl();
    if (!sheetUrl) return;

    try {
      const res = await fetchNotesFromGoogleSheet('');
      if (res.success && Array.isArray(res.notes)) {
        const localNotes = getStoredNotes();
        const deletedIds = getDeletedNoteIds();
        let changed = false;

        // 1. Group remote notes by ID keeping the newest version, skip blank/deleted
        const remoteMap = new Map();
        res.notes.forEach((remote) => {
          if (!remote.id || deletedIds.has(String(remote.id).trim())) return;
          if (!remote.note || !String(remote.note).trim()) return;

          const existing = remoteMap.get(remote.id);
          if (!existing || new Date(remote.timestamp) > new Date(existing.timestamp)) {
            remoteMap.set(remote.id, remote);
          }
        });

        // 2. Merge newest remote notes into local storage
        remoteMap.forEach((remote, id) => {
          const localIdx = localNotes.findIndex((l) => String(l.id).trim() === String(id).trim());
          if (localIdx === -1) {
            localNotes.unshift({
              id: id,
              topic: remote.topic || 'General',
              text: remote.note,
              timestamp: remote.timestamp || new Date().toISOString(),
              author: remote.author || 'Saurav Patel',
              synced: true
            });
            changed = true;
          } else {
            // Update if remote timestamp is newer than local or if text changed
            const remoteTime = new Date(remote.timestamp).getTime();
            const localTime = new Date(localNotes[localIdx].timestamp).getTime();
            if (remoteTime >= localTime && localNotes[localIdx].text !== remote.note) {
              localNotes[localIdx].text = remote.note;
              localNotes[localIdx].timestamp = remote.timestamp;
              localNotes[localIdx].synced = true;
              changed = true;
            }
          }
        });

        // 3. Purge notes from local storage that were deleted from Google Sheets by other windows
        const remoteIds = new Set(Array.from(remoteMap.keys()).map((k) => String(k).trim()));
        const cleanNotes = localNotes.filter((n) => {
          const id = String(n.id).trim();
          if (deletedIds.has(id)) return false;
          // If note was synced to cloud, but cloud no longer contains it -> deleted elsewhere!
          if (n.synced && !remoteIds.has(id)) {
            addDeletedNoteId(id);
            return false;
          }
          return true;
        });

        if (cleanNotes.length !== localNotes.length) {
          changed = true;
        }

        if (changed) {
          saveStoredNotes(cleanNotes);
          refreshAllInlineNotes();
          updateNotesCountBadges();
          if (document.getElementById('sf-pane-view') && document.getElementById('sf-pane-view').classList.contains('is-active')) {
            renderNotesList();
          }
          if (showFeedback) {
            showToast('✅ Notes updated and synced from Google Sheet!');
          }
        } else if (showFeedback) {
          showToast('✅ Notes are already up to date with Google Sheet.');
        }
      }
    } catch (e) {
      if (showFeedback) {
        showToast('⚠️ Cloud sync error: ' + e.message);
      }
    }
  }

  function handleExportCSV() {
    const notes = getStoredNotes();
    if (notes.length === 0) {
      alert('No notes to export.');
      return;
    }

    const headers = ['Timestamp', 'Topic', 'Note', 'Author', 'Synced'];
    const rows = notes.map((n) => [
      `"${n.timestamp}"`,
      `"${(n.topic || '').replace(/"/g, '""')}"`,
      `"${(n.text || '').replace(/"/g, '""')}"`,
      `"${(n.author || '').replace(/"/g, '""')}"`,
      `"${n.synced ? 'YES' : 'NO'}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `snowflake_prep_notes_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('📥 Notes exported as CSV!');
  }

  // Update note count badges on topic cards
  function updateNotesCountBadges() {
    const notes = getStoredNotes();
    const topicCounts = {};
    notes.forEach((n) => {
      topicCounts[n.topic] = (topicCounts[n.topic] || 0) + 1;
    });

    document.querySelectorAll('.topic-note-btn[data-topic]').forEach((btn) => {
      const topic = btn.getAttribute('data-topic');
      const count = topicCounts[topic] || 0;
      let badge = btn.querySelector('.note-count-badge');

      if (count > 0) {
        if (!badge) {
          badge = document.createElement('span');
          badge.className = 'note-count-badge';
          btn.appendChild(badge);
        }
        badge.textContent = count;
      } else if (badge) {
        badge.remove();
      }
    });

    refreshAllInlineNotes();
  }

  function getModuleName() {
    const title = document.title || '';
    const match = title.match(/Module\s*(\d+)/i);
    if (match) {
      return `Module ${match[1].padStart(2, '0')}`;
    }
    const pathMatch = window.location.pathname.match(/module(\d+)/i);
    if (pathMatch) {
      return `Module ${pathMatch[1].padStart(2, '0')}`;
    }
    return '';
  }

  // =========================================================================
  // Inline Topic Notes Setup (Placed right next to each topic tag)
  // =========================================================================
  function initInlineTopicNotes() {
    const moduleName = getModuleName();
    if (!moduleName) return;

    // 1. Modules 01-13: Scan .box .tag and .wwh .tag (e.g. "01 · WHAT IS IT")
    const tags = document.querySelectorAll('.box .tag, .wwh .tag');
    tags.forEach((tagEl) => {
      if (tagEl.dataset.notesInitialized) return;
      tagEl.dataset.notesInitialized = 'true';

      const tagText = tagEl.textContent.trim();
      const section = tagEl.closest('section') || tagEl.closest('.section');
      let chapterTitle = '';
      if (section) {
        const eyebrow = section.querySelector('.eyebrow, .section-label');
        const h2 = section.querySelector('h2');
        const chNum = eyebrow ? eyebrow.textContent.trim().split('·')[0].trim() : '';
        const chName = h2 ? h2.textContent.trim().split('·')[0].trim() : '';
        chapterTitle = [chNum, chName].filter(Boolean).join(' - ');
      }

      const topicKey = [moduleName, chapterTitle, tagText].filter(Boolean).join(' · ');

      // Insert button right next to the tag
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'inline-topic-note-btn';
      btn.setAttribute('data-topic', topicKey);
      btn.setAttribute('title', `Add / View note for ${tagText}`);
      btn.innerHTML = '<span>📝 Note</span>';

      tagEl.parentNode.insertBefore(btn, tagEl.nextSibling);

      // Create container for inline note cards / editor inside this box
      const container = document.createElement('div');
      container.className = 'inline-note-wrapper';
      container.setAttribute('data-topic', topicKey);

      btn.parentNode.insertBefore(container, btn.nextSibling);

      // Clicking note button toggles inline editor (or opens single master unlock if locked)
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!isGlobalUnlocked()) {
          openMasterUnlockModal(() => {
            toggleInlineEditor(container, topicKey);
          });
          return;
        }
        toggleInlineEditor(container, topicKey);
      });
    });

    // 2. Modules 14-16: Scan .trio-item elements
    const trios = document.querySelectorAll('.trio-item');
    trios.forEach((trioEl) => {
      if (trioEl.dataset.notesInitialized) return;
      trioEl.dataset.notesInitialized = 'true';

      const h4 = trioEl.querySelector('h4');
      const headerText = h4 ? h4.textContent.trim() : 'Topic';
      const section = trioEl.closest('.section') || trioEl.closest('section');
      let chapterTitle = '';
      if (section) {
        const label = section.querySelector('.section-label');
        const h2 = section.querySelector('h2');
        const chNum = label ? label.textContent.trim() : '';
        const chName = h2 ? h2.textContent.trim() : '';
        chapterTitle = [chNum, chName].filter(Boolean).join(' - ');
      }

      const topicKey = [moduleName, chapterTitle, headerText].filter(Boolean).join(' · ');

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'inline-topic-note-btn';
      btn.setAttribute('data-topic', topicKey);
      btn.setAttribute('title', `Add / View note for ${headerText}`);
      btn.innerHTML = '<span>📝 Note</span>';

      if (h4) {
        h4.appendChild(btn);
      } else {
        trioEl.insertBefore(btn, trioEl.firstChild);
      }

      const container = document.createElement('div');
      container.className = 'inline-note-wrapper';
      container.setAttribute('data-topic', topicKey);

      btn.parentNode.insertBefore(container, btn.nextSibling);

      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!isGlobalUnlocked()) {
          openMasterUnlockModal(() => {
            toggleInlineEditor(container, topicKey);
          });
          return;
        }
        toggleInlineEditor(container, topicKey);
      });
    });

    refreshAllInlineNotes();
  }

  // Refresh all inline note boxes across the page
  function refreshAllInlineNotes() {
    const isUnlocked = isGlobalUnlocked();
    const allNotes = getStoredNotes();

    document.querySelectorAll('.inline-note-wrapper[data-topic]').forEach((wrapper) => {
      const topicKey = wrapper.getAttribute('data-topic');
      const topicNotes = allNotes.filter((n) => n.topic === topicKey);
      const btn = wrapper.previousElementSibling;

      if (topicNotes.length === 0) {
        if (!wrapper.querySelector('.inline-note-editor')) {
          wrapper.innerHTML = '';
        }
        if (btn && btn.classList.contains('inline-topic-note-btn')) {
          btn.classList.remove('has-notes');
          btn.innerHTML = '<span>📝 Note</span>';
          btn.title = isUnlocked ? 'Add note for this topic' : 'Enter password once to enable notes';
        }
        return;
      }

      // Notes exist for this topic!
      if (btn && btn.classList.contains('inline-topic-note-btn')) {
        btn.classList.add('has-notes');
        btn.innerHTML = isUnlocked
          ? `<span>📝 Note (${topicNotes.length})</span>`
          : `<span>🔒 Note (${topicNotes.length})</span>`;
        btn.title = isUnlocked
          ? `Click to edit/add notes (${topicNotes.length} saved)`
          : `Notes locked: Enter password once in top bar to enable (${topicNotes.length} saved)`;
      }

      if (isUnlocked) {
        // UNLOCKED: Display the user's takeaway card right under the topic tag
        if (wrapper.querySelector('.inline-note-editor')) {
          return; // Don't interrupt if user is typing in editor
        }

        const latest = topicNotes[0];
        const dateStr = new Date(latest.timestamp).toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric'
        });

        wrapper.innerHTML = `
          <div class="inline-note-card unlocked">
            <div class="inline-note-head">
              <span class="pin-label">📌 Your Key Takeaway:</span>
              <div class="inline-note-actions-row">
                <span>${dateStr}</span>
                <button type="button" class="inline-note-action-btn edit-note-btn" title="Edit note">✏️ Edit</button>
                <button type="button" class="inline-note-action-btn del-note-btn" title="Delete note">🗑️</button>
              </div>
            </div>
            <div class="inline-note-body">${escapeHTML(latest.text)}</div>
          </div>
        `;

        const editBtn = wrapper.querySelector('.edit-note-btn');
        if (editBtn) {
          editBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleInlineEditor(wrapper, topicKey, latest.text, latest.id);
          });
        }

        const delBtn = wrapper.querySelector('.del-note-btn');
        if (delBtn) {
          delBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (confirm('Delete this note?')) {
              deleteNote(latest.id);
              refreshAllInlineNotes();
            }
          });
        }

      } else {
        // LOCKED: Show locked status with ONE button that triggers the Master Unlock Modal
        wrapper.innerHTML = `
          <div class="inline-note-card locked">
            <span style="font-size:12.5px;color:var(--ink2);">🔒 <b>${topicNotes.length} Note saved</b></span>
            <button type="button" class="inline-note-action-btn unlock-inline-btn" style="color:var(--amber);border-color:var(--amber);font-weight:600;">Enable Notes</button>
          </div>
        `;

        const unlockBtn = wrapper.querySelector('.unlock-inline-btn');
        if (unlockBtn) {
          unlockBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            openMasterUnlockModal();
          });
        }
      }
    });
  }

  // Toggle inline note editor
  function toggleInlineEditor(container, topicKey, initialText = '', existingId = null) {
    const existingEditor = container.querySelector('.inline-note-editor');
    if (existingEditor) {
      existingEditor.remove();
      refreshAllInlineNotes();
      return;
    }

    const editorEl = document.createElement('div');
    editorEl.className = 'inline-note-editor';
    editorEl.innerHTML = `
      <textarea placeholder="Write what you understood or want to remember for this topic...">${escapeHTML(initialText)}</textarea>
      <div class="inline-note-editor-footer">
        <div style="display:flex;gap:6px;">
          <button type="button" class="sf-btn sf-btn-primary sf-btn-sm save-inline-btn">💾 Save Note</button>
          <button type="button" class="sf-btn sf-btn-sm cancel-inline-btn">Cancel</button>
        </div>
        <span style="font-size:11px;font-family:var(--f-mono);color:var(--ink3);">
          ${getGoogleSheetUrl() ? '🟢 Auto-sync to Google Sheet' : '💾 Saves locally (Link Sheet in ⚙️ nav)'}
        </span>
      </div>
    `;

    container.prepend(editorEl);
    const textarea = editorEl.querySelector('textarea');
    textarea.focus();

    editorEl.querySelector('.cancel-inline-btn').addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      editorEl.remove();
      refreshAllInlineNotes();
    });

    editorEl.querySelector('.save-inline-btn').addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      const text = textarea.value.trim();
      if (!text) {
        showToast('⚠️ Please write a note before saving.');
        return;
      }

      const saveBtn = editorEl.querySelector('.save-inline-btn');
      saveBtn.disabled = true;
      saveBtn.textContent = 'Saving...';

      let notes = getStoredNotes();
      let targetNote = null;
      let isEdit = false;
      if (existingId) {
        const noteIdx = notes.findIndex((n) => n.id === existingId);
        if (noteIdx !== -1) {
          notes[noteIdx].text = text;
          notes[noteIdx].timestamp = new Date().toISOString();
          notes[noteIdx].synced = false;
          targetNote = notes[noteIdx];
          isEdit = true;
        }
      } else {
        targetNote = {
          id: 'note_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
          topic: topicKey,
          text: text,
          timestamp: new Date().toISOString(),
          author: 'Saurav Patel',
          synced: false
        };
        notes.unshift(targetNote);
      }

      saveStoredNotes(notes);

      // Attempt Google Sheet sync with action ('edit' or 'add')
      const sheetUrl = getGoogleSheetUrl();
      if (sheetUrl && targetNote) {
        const syncRes = await syncNoteToGoogleSheet(targetNote, isEdit ? 'edit' : 'add');
        if (syncRes.success) {
          targetNote.synced = true;
          saveStoredNotes(notes);
          showToast(isEdit ? '✅ Note updated and synced to Google Sheet!' : '✅ Note saved and synced to Google Spreadsheet!');
        } else {
          showToast('💾 Note saved locally (Google Sheet sync failed: check URL)');
        }
      } else {
        showToast('💾 Note saved locally! (Link Google Sheet to auto-sync to cloud)');
      }

      // Mark unlocked globally so user immediately sees what they just wrote!
      setGlobalUnlocked(true);

      editorEl.remove();
      refreshAllInlineNotes();
    });
  }

  // HTML escaping helper
  function escapeHTML(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Global exposure
  window.openTopicNotes = function (topicName, event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    openModal(topicName);
  };

  window.openMasterUnlockModal = openMasterUnlockModal;
  window.openMasterSearchModal = openMasterSearchModal;
  window.closeMasterSearchModal = closeMasterSearchModal;
  window.openMasterMenuModal = openMasterMenuModal;
  window.updateNotesCountBadges = updateNotesCountBadges;

  // Auto initialize on DOM ready
  function initAll() {
    injectMasterSearchHTML();
    injectMasterModalsHTML();
    injectCopyGuardModalHTML();
    injectModalHTML();
    attachCopyGuard(document);
    initMasterTopNavButton();
    updateNotesCountBadges();
    initInlineTopicNotes();
    autoSyncFromGoogleSheet(false);

    // Listen for storage changes across tabs
    window.addEventListener('storage', (e) => {
      if (e.key === STORAGE_KEYS.NOTES || e.key === STORAGE_KEYS.DELETED || e.key === STORAGE_KEYS.GLOBAL_UNLOCKED) {
        refreshAllInlineNotes();
        updateNotesCountBadges();
        updateMasterLockBtnUI();
    const sheetTab = document.getElementById('sf-tab-sheet');
    if (sheetTab) {
      sheetTab.style.display = isGlobalUnlocked() ? 'inline-block' : 'none';
    }
        const viewPane = document.getElementById('sf-pane-view');
        if (viewPane && viewPane.classList.contains('is-active')) {
          renderNotesList();
        }
      }
    });

    // Global keyboard shortcut: Cmd+K / Ctrl+K or / to open Master Search
    document.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        openMasterSearchModal();
      } else if (e.key === '/' && !['input', 'textarea'].includes((document.activeElement.tagName || '').toLowerCase()) && !document.activeElement.isContentEditable) {
        e.preventDefault();
        openMasterSearchModal();
      }
    });

    // Attach click listeners to any .topic-note-btn
    document.body.addEventListener('click', (e) => {
      const btn = e.target.closest('.topic-note-btn');
      if (btn && !btn.classList.contains('inline-topic-note-btn')) {
        e.preventDefault();
        e.stopPropagation();
        const topic = btn.getAttribute('data-topic') || currentTopic;
        if (!isGlobalUnlocked()) {
          openMasterUnlockModal(() => openModal(topic));
        } else {
          openModal(topic);
        }
      }
    });
  }

  document.addEventListener('DOMContentLoaded', initAll);
  if (document.readyState === 'interactive' || document.readyState === 'complete') {
    initAll();
  }
})();
