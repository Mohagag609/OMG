// تعريف TypeScript لـ better-sqlite3
declare module 'better-sqlite3' {
  interface Database {
    prepare(sql: string): Statement
    pragma(pragma: string): any
    close(): void
  }

  interface Statement {
    run(...params: any[]): { changes: number; lastInsertRowid: number }
    get(...params: any[]): any
    all(...params: any[]): any[]
  }

  class Database {
    constructor(filename: string)
    static Database: typeof Database
  }

  export = Database
}