import { Module } from "@nestjs/common";
import { MasterService } from "./master.service";
import {
  AttributesController,
  CategoriesController,
  LocationsController,
} from "./resource.controllers";

@Module({
  controllers: [
    CategoriesController,
    LocationsController,
    AttributesController,
  ],
  providers: [MasterService],
})
export class MasterModule {}
