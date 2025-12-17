export interface NfeInboxItem {
  id: string;
  accessKey: string;
  senderEmail: string;
  status: 'PENDING' | 'IMPORTED' | 'IGNORED' | 'ERROR';
  receivedAt: string;
  tenantId: string;
}
