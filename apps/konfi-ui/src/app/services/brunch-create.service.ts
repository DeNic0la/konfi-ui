import { inject, Injectable } from '@angular/core';
import { z } from 'zod';
import { HttpClient } from '@angular/common/http';
import {environment} from "../../environments/environment";

@Injectable({
  providedIn: 'root',
})
export class BrunchCreateService {
  private readonly http = inject(HttpClient);
  public send(
    data: Partial<{
      title: string | null;
      id: string | null;
      votingPassword: string | null;
      adminPassword: string | null;
      question: string | null;
    }>
  ) {
    const { title, adminPassword, votingPassword, id, question } = data;
    const validData = brunch_schema.parse({
      title,
      id,
      adminPassword,
      votingPassword,
      questions: question,
    });
    return this.http.post(`${environment.backendUrl}api/brunches`, validData);
  }
}

const question_schema = z.object({
  min: z.number().int().max(5).min(1).default(1),
  max: z.number().int().min(1).max(13).default(5),
  recomended: z.number().int().default(1),
  title: z.string().nonempty(),
});

const brunch_schema = z.object({
  title: z.string().nonempty(),
  id: z
    .string()
    .min(3)
    .max(50)
    .regex(/^[a-zA-Z0-9-]+$/),
  adminPassword: z.string().min(1).nullable().catch(null).default(null),
  votingPassword: z.string().min(1).nullable().catch(null).default(null),
  questions: z
    .string()
    .nonempty()
    .transform((v) => [{ title: v }])
    .pipe(z.array(question_schema)),
});
