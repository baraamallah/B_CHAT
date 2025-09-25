
export type SecurityRuleContext = {
  path: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete' | 'write';
  requestResourceData?: any;
};

export class FirestorePermissionError extends Error {
  public context: SecurityRuleContext;

  constructor(context: SecurityRuleContext) {
    const deniedMessage = `The following request was denied by Firestore Security Rules:`;
    const contextMessage = JSON.stringify(
      {
        path: context.path,
        operation: context.operation,
        requestResourceData: context.requestResourceData ?? 'No data provided',
      },
      null,
      2
    );

    super(`FirestoreError: Missing or insufficient permissions: ${deniedMessage}\n${contextMessage}`);
    this.name = 'FirestorePermissionError';
    this.context = context;

    // This is to make sure the instance of check works correctly
    Object.setPrototypeOf(this, FirestorePermissionError.prototype);
  }

  toPlainObject() {
    return {
      name: this.name,
      message: this.message,
      context: this.context,
      stack: this.stack,
    };
  }
}
