
import {z} from 'zod';


export const MessageType = z.enum(["JOIN", "LEAVE", "UPDATE"]);
export const TableMessage = z.object({
  type: MessageType,
  konfi: z.number().int().max(5).default(0).nullable(),
  user: z.string().max(50).nullable()
})
export const CheckTableMessage = TableMessage.or(
  z.string()
    .transform((data) => JSON.parse(data) )
    .pipe(TableMessage)
);
