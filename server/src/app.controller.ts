import { Controller, Get, Param } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('categories')
  async getCategories() {
    return this.appService.getCategories();
  }

  @Get('templates')
  async getTemplates() {
    return this.appService.getTemplates();
  }

  @Get('templates/:id')
  async getTemplateById(@Param('id') id: string) {
    return this.appService.getTemplateById(id);
  }
}
