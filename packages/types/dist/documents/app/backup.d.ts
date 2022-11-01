import { Document } from "../document";
import { User } from "../../";
export declare enum AppBackupType {
    BACKUP = "backup",
    RESTORE = "restore"
}
export declare enum AppBackupStatus {
    STARTED = "started",
    PENDING = "pending",
    COMPLETE = "complete",
    FAILED = "failed"
}
export declare enum AppBackupTrigger {
    PUBLISH = "publish",
    MANUAL = "manual",
    SCHEDULED = "scheduled",
    RESTORING = "restoring"
}
export interface AppBackupContents {
    datasources: string[];
    screens: string[];
    automations: string[];
}
export interface AppBackupMetadata {
    appId: string;
    trigger?: AppBackupTrigger;
    type: AppBackupType;
    status: AppBackupStatus;
    name?: string;
    createdBy?: string | User;
    timestamp: string;
    finishedAt?: string;
    startedAt?: string;
    contents?: AppBackupContents;
}
export interface AppBackup extends Document, AppBackupMetadata {
    filename?: string;
}
export declare type AppBackupFetchOpts = {
    trigger?: AppBackupTrigger;
    type?: AppBackupType;
    limit?: number;
    page?: string;
    paginate?: boolean;
    startDate?: string;
    endDate?: string;
};
export interface AppBackupQueueData {
    appId: string;
    docId: string;
    docRev: string;
    export?: {
        trigger: AppBackupTrigger;
        name?: string;
        createdBy?: string;
    };
    import?: {
        backupId: string;
        nameForBackup: string;
        createdBy?: string;
    };
}
