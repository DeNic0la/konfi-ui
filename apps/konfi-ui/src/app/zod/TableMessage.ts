
import {z} from 'zod';

export const MessageType =>z.enum(["JOIN", "LEAVE", "UPDATE"]);

onst const TableMessage{

}
MessageType.object({
  type: MessageType,
  konfi: z.number().int().max(5),
  user: z.string().max(50)
})
