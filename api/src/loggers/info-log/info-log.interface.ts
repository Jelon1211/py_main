export interface IInfoLog {
	message: string; // Info message
	additionalData?: unknown; // Object with any additional data that cen help identify problem
	taskId?: string; // UUID of task if provided
}
