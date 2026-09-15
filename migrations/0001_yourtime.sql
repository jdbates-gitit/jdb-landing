CREATE TABLE IF NOT EXISTS yourtime_list (
 id INTEGER PRIMARY KEY CHECK (id=1),
 revision INTEGER NOT NULL DEFAULT 0,
 state TEXT NOT NULL,
 updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT OR IGNORE INTO yourtime_list (id,revision,state) VALUES (1,0,'{"saved":[],"completed":[],"custom":[],"deleted":[]}');
