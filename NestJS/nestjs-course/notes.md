NestJS

`npm install -g @nestjs/cli`

## Tasks Application

### Application Structure

```
AppModule
    - TasksModule
        - TasksController
        - TaskEntity
        - TasksService
        - Status ValidationPipe
        - TaskRepository
    - AuthModule
        - AuthController
        - AuthService
        - UserEntity
        - UserRepository
        - JwtStrategy
```

```
GET /tasks
GET /tasks:id
POST /tasks
PUT /tasks/:id
DELETE /tasks/:id
```

## Modules

NestJS Modules

- Each application has at leaset one module - the root module. Thatis the starting point of the application.
- Modules are an effective way to organize components by a closely related set of capabilities
- It is a good practice t ohave a folder per module, containing the module's components.
- Modulews are singletons, therefore a module can be imported by multiple other modules.

Defining a module

A module is defined by annotating a class with `@Module` decorator.

The decorator provides metadata that Nest uses to organize the application structure.

`nest g module tasks`

## Controllers

- Responsible for handling incoming request and returning responses to the client
- Bound to a specific path
- Contain handlers, which handle endpoints and request methods
- Can take advantage of dependency injection to conume providers within the same module.

```javascript
@Controller("/tasks")
export class TaskController {
  @Get()
  getAllTasks() {}
  @Post()
  createTask() {}
}
```

`nest g controllers tasks --no-spec`

## Providers

- Can be injected into constructors if decorated as @Injectable, via dependency injection
- Can be plain value, a class, sync/async factory etc.
- Providers must be provided to a module for them to be usable.
- Can be exported from a module- and then be available to other modules that import it.

### Services

- Defined as providers. Not all providers are services.
- Common concept within software development and are note exclusive to NestJS, etc
- Singleton when wrapped with @Injectable()jJA and provided to a module. That means, the same instance will be shared across the application - acting as as single source of truth.
- The main source of business logic. FOr example, a service will be called from a controlelr to validate data, create an item in the database and return a response.

```javascript
import { TasksCSontroller } from "./tasks.controller";
import { TasksService } from "./tasks.service";
import { LoggerService } from "./shared/logger.service";

@Module({
  controllers: [TasksController],
  providers: [TasksService, LoggerService]
})
export class TasksModule {}
```

Dependency Injection in NestJS

Any component within the NestJS ecosystem can inject a provider that is decorated with @Injectable.

We defined the dependencies in the constructor of a class. NestJS will take care of the injection for us, and it will then be available as a class property

```javascript
import { TasksService } from'./tasks.service';

@Controller('/tasks')
export class TasksController {
    constructor(private tasksService: TasksService) {}

    @Get()
    async getAllTasks() {
        return await this.tasksService.getAllTasks();
    }
}
```
