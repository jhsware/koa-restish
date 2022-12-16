
export class RestishServerError extends Error  {
  name: string;
  code: number;
  
  constructor(message, name, code) {
    super(message);
    this.name = name;
    this.code = code
  }
}

export class NotFound extends RestishServerError {
  constructor(message = 'Not Found') {
    super(message, "NotFound", 404);
  }
}

export class BadRequest extends RestishServerError {
  constructor(message = 'Bad Request') {
    super(message, "BadRequest", 400);
  }
}

export class Forbidden extends RestishServerError {
  constructor(message = 'Forbidden') {
    super(message, "Forbidden", 403);
  }
}

export class InternalServerError extends RestishServerError {
  constructor(message = 'Internal Server Error') {
    super(message, "InternalServerError", 500);
  }
}