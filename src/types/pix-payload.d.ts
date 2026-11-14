declare module "pix-payload" {
  export function payload(data: {
    key: string;
    name: string;
    city: string;
    amount?: number;
    transactionId?: string;
  }): string;
}