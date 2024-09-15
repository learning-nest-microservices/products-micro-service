import {
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PrismaClient } from '@prisma/client';
import { PaginationDto } from '../common';

@Injectable()
export class ProductsService extends PrismaClient implements OnModuleInit {
  private readonly logger = new Logger('ProductsService');

  onModuleInit() {
    this.$connect();
    this.logger.log('Connected to database');
  }

  async create(createProductDto: CreateProductDto) {
    this.logger.log(`Creating a new product: ${createProductDto.name}`);
    return await this.product.create({
      data: createProductDto,
    });
  }

  async findAll(paginationDto: PaginationDto) {
    this.logger.log(
      `Finding all products with pagination ${JSON.stringify(paginationDto)}`,
    );
    const { page, limit } = paginationDto;
    const total = await this.product.count({
      where: {
        available: true,
      },
    });
    const totalPages = Math.ceil(total / limit);
    const products = await this.product.findMany({
      skip: (page - 1) * limit,
      take: limit,
      where: {
        available: true,
      },
    });
    return {
      data: products,
      pagination: {
        page,
        limit,
        totalPages,
        previousPage: page - 1 > 0 ? page - 1 : null,
        nextPage: page + 1 <= totalPages ? page + 1 : null,
      },
    };
  }

  async findOne(id: string) {
    this.logger.log(`Finding a product with id ${id}`);
    const product = await this.product.findUnique({
      where: {
        id,
        available: true,
      },
    });
    if (!product) {
      throw new NotFoundException(`Product with id ${id} not found`);
    }
    return product;
  }

  async update(id: string, updateProductDto: UpdateProductDto) {
    this.logger.log(`Updating a product with id ${id}`);
    await this.findOne(id);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id: __, ...data } = updateProductDto;
    if (!data.name && !data.price) {
      throw new Error('Name and price are required');
    }
    const product = await this.product.update({
      where: {
        id,
      },
      data: data,
    });
    return product;
  }

  async remove(id: string) {
    this.logger.log(`Removing a product with id ${id}`);
    await this.findOne(id);
    const product = await this.product.update({
      where: { id },
      data: {
        available: false,
      },
    });
    return product;
  }
}
