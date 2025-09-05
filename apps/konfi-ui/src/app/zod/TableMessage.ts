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


const zUser = z.object({user: z.string().min(2)})
  .or(z.object({username: z.string().min(2)}).transform(({username}) => ({user:username})))
  .or(z.string().min(2).transform(user => ({user})));

export const TableBody = {
  Join: zUser.transform(({user}) => JSON.stringify({user, type: 'JOIN'})).parse,
  Update: z.object({user: z.string().min(2),konfi: z.number().int()})
    .transform(({user, konfi}) => JSON.stringify({user, konfi, type: 'UPDATE'})).parse,
}
export const TableDestination = {
  Join: ((tablename:string)=>`/live/join/${tablename}`),
  Update: ((tablename:string)=>`/live/update/${tablename}`),
}

