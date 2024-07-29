import { OpenAPIRoute } from 'chanfana';
import { z } from 'zod';
import { HTTPException } from 'hono/http-exception';

export class ApiRoute extends OpenAPIRoute {
  handleValidationError(errors: z.ZodIssue[]): Response {
    return Response.json({
      errors: errors,
      success: false,
      result: {},
    }, {
      status: 400,
    })
  }
}
