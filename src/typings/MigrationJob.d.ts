interface MigrationJob {
    sourceDB: string;
    destinationDB: string;
    schemas: Schema[];
}

interface Schema {
    source: string;
    destination: string;
    sourceDateField: string;
    destinationDateField: string;
    mapper: string;
    lastpk: string;
}