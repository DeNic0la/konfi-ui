import { z } from 'zod';

export const MessageType = z.enum(['JOIN', 'LEAVE', 'UPDATE']);
export const TableMessage = z.object({
  type: MessageType,
  konfi: z.number().int().max(5).default(0).nullable(),
  user: z.string().max(50).nullable(),
});
export const CheckTableMessage = TableMessage.or(
  z
    .string()
    .transform((data) => {
      try {
        return JSON.parse(data);
      } catch {
        return data; // Return the unparseable string, let validation fail later
      }
    })
    .pipe(TableMessage)
);
