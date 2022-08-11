import { View, Table, TableExportFormat } from "@budibase/types";
export declare function created(view: View, timestamp?: string | number): Promise<void>;
export declare function updated(view: View): Promise<void>;
export declare function deleted(view: View): Promise<void>;
export declare function exported(table: Table, format: TableExportFormat): Promise<void>;
export declare function filterCreated(view: View, timestamp?: string | number): Promise<void>;
export declare function filterUpdated(view: View): Promise<void>;
export declare function filterDeleted(view: View): Promise<void>;
export declare function calculationCreated(view: View, timestamp?: string | number): Promise<void>;
export declare function calculationUpdated(view: View): Promise<void>;
export declare function calculationDeleted(existingView: View): Promise<void>;
