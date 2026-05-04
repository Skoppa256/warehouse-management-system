import {
  UploadedFile,
  UseInterceptors,
  Controller,
  Post,
  UseGuards,
  Req,
  ValidationPipe,
  UsePipes,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('upload')
export class UploadController {
  @Post()
  @UseGuards(JwtAuthGuard)
  @UsePipes(
    new ValidationPipe({ skipMissingProperties: true, whitelist: false }),
  )
  @UseInterceptors(FileInterceptor('image'))
  uploadFile(@UploadedFile() file: Express.Multer.File, @Req() req) {
    if (!file) {
      return { imagePath: null };
    }

    const baseUrl = `${req.protocol}://${req.get('host')}`;

    return {
      filename: file.filename,
      imagePath: `/uploads/${file.filename}`,
      url: `${baseUrl}/uploads/${file.filename}`,
    };
  }
}
