import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as common from 'oci-common';
import * as objectStorage from 'oci-objectstorage';
import { requests } from 'oci-objectstorage';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { execSync } from 'child_process';
import moment from 'moment';

@Injectable()
export class ObjectStorageService {
  private objectStorageClient: objectStorage.ObjectStorageClient;
  private namespace: string;
  private bucketName: string;
  private readonly logger = new Logger(ObjectStorageService.name);

  constructor(private configService: ConfigService) {
    try {
      // .env 파일에서 가져온 구성 파일 경로
      const configFilePath = this.configService.get<string>('OCI_CONFIG_PATH');
      if (!configFilePath) {
        throw new Error('OCI_CONFIG_PATH is not defined in .env file');
      }

      // 디렉터리 생성
      const configDir = path.dirname(configFilePath);
      this.logger.log(`Config directory path: ${configDir}`);

      if (!fs.existsSync(configDir)) {
        this.logger.log('Directory does not exist. Creating...');
        fs.mkdirSync(configDir, { recursive: true });
        this.logger.log('Directory created.');
      } else {
        this.logger.log('Directory already exists.');
      }

      // PEM 파일 내용을 환경변수에서 읽기
      const apiKeyContent = this.configService.get<string>('OCI_API_KEY');
      if (!apiKeyContent) {
        throw new Error('OCI_API_KEY is not defined in .env file');
      }

      // 인증 정보를 포함한 구성 파일을 작성
      const configFileContent = `[DEFAULT]
user=${this.configService.get<string>('OCI_USER')}
fingerprint=${this.configService.get<string>('OCI_FINGERPRINT')}
tenancy=${this.configService.get<string>('OCI_TENANCY')}
region=${this.configService.get<string>('OCI_REGION')}
key_file=${this.configService.get<string>('OCI_KEY_FILE')}`;

      this.logger.log(`Config file content:\n${configFileContent}`);

      // 구성 파일을 작성
      fs.writeFileSync(
        configFilePath,
        configFileContent.replace(/\r\n/g, '\n'),
      ); // 줄바꿈 문자 처리
      this.logger.log(`Config file created at: ${configFilePath}`);

      // PEM 파일 생성
      const apiKeyFilePath = this.configService.get<string>('OCI_KEY_FILE');
      if (!apiKeyFilePath) {
        throw new Error('OCI_KEY_FILE is not defined in .env file');
      }

      // 디렉토리 생성
      const apiKeyDir = path.dirname(apiKeyFilePath);
      if (!fs.existsSync(apiKeyDir)) {
        this.logger.log(`Creating directory for API key file at: ${apiKeyDir}`);
        fs.mkdirSync(apiKeyDir, { recursive: true });
      }

      this.logger.log(`Creating API key file at: ${apiKeyFilePath}`);
      fs.writeFileSync(apiKeyFilePath, apiKeyContent.replace(/\(\)/g, '\n')); // 줄바꿈 문자 처리
      this.logger.log(`API key file created at: ${apiKeyFilePath}`);

      // 권한 설정
      this.setPermissions(apiKeyFilePath);

      // 인증 제공자 설정
      const provider = new common.ConfigFileAuthenticationDetailsProvider(
        configFilePath,
      );
      this.objectStorageClient = new objectStorage.ObjectStorageClient({
        authenticationDetailsProvider: provider,
      });

      this.namespace = this.configService.get<string>('OCI_NAMESPACE');
      this.bucketName = this.configService.get<string>('OCI_BUCKET_NAME');

      this.logger.log(`Namespace: ${this.namespace}`);
      this.logger.log(`Bucket Name: ${this.bucketName}`);
    } catch (error) {
      this.logger.error('Failed to initialize ObjectStorageService', error);
      throw error;
    }
  }

  private setPermissions(filePath: string) {
    const platform = os.platform();

    if (platform === 'win32') {
      try {
        this.logger.log(`Setting permissions for Windows on file: ${filePath}`);
        execSync(`icacls "${filePath}" /inheritance:r`);
        execSync(`icacls "${filePath}" /grant:r "BUILTIN\\Administrators:(F)"`);
        execSync(`icacls "${filePath}" /grant:r "NT AUTHORITY\\SYSTEM:(F)"`);
        execSync(
          `icacls "${filePath}" /grant:r "NT AUTHORITY\\Authenticated Users:(M)"`,
        );
        execSync(`icacls "${filePath}" /grant:r "BUILTIN\\Users:(RX)"`);
        this.logger.log(`Permissions set for Windows file: ${filePath}`);
      } catch (error) {
        this.logger.error('Failed to set permissions on Windows file', error);
      }
    } else if (platform === 'linux' || platform === 'darwin') {
      try {
        // Set file permissions
        fs.chmodSync(filePath, '600');
        this.logger.log(`Permissions set for Linux/macOS file: ${filePath}`);
      } catch (error) {
        this.logger.error(
          'Failed to set permissions on Linux/macOS file',
          error,
        );
      }
    } else {
      this.logger.log('Unsupported platform detected for permission setting.');
    }
  }

  async uploadFile(
    file: Express.Multer.File,
  ): Promise<objectStorage.responses.PutObjectResponse> {
    try {
      const folderName = 'Study-Camp-Space-Img';

      // 현재 시간을 포맷하여 파일명에 추가
      const timestamp = moment().format('YYYY-MM-DD-HH:mm:ss');
      const fileName = `${timestamp}-Space-${file.originalname}`;

      // 폴더가 있는지 확인하는 로직
      const listObjectsRequest: requests.ListObjectsRequest = {
        namespaceName: this.namespace,
        bucketName: this.bucketName,
        prefix: folderName + '/',
        limit: 1,
      };

      this.logger.log(`Checking if folder exists: ${folderName}`);
      const listObjectsResponse =
        await this.objectStorageClient.listObjects(listObjectsRequest);
      const folderExists = listObjectsResponse.listObjects.objects.length > 0;

      if (!folderExists) {
        this.logger.log(
          `Folder does not exist. Creating folder: ${folderName}`,
        );
        const createFolderRequest: requests.PutObjectRequest = {
          namespaceName: this.namespace,
          bucketName: this.bucketName,
          objectName: folderName + '/', // 폴더처럼 보이도록 하기 위해 슬래시로 끝나는 이름 사용
          putObjectBody: Buffer.alloc(0), // 빈 파일 업로드
          contentLength: 0,
        };
        await this.objectStorageClient.putObject(createFolderRequest);
        this.logger.log(`Folder created: ${folderName}`);
      } else {
        this.logger.log(`Folder already exists: ${folderName}`);
      }

      // 파일 업로드
      this.logger.log(
        `Uploading file: ${file.originalname} as ${fileName} to folder: ${folderName}`,
      );
      const putObjectRequest: requests.PutObjectRequest = {
        namespaceName: this.namespace,
        bucketName: this.bucketName,
        putObjectBody: file.buffer,
        objectName: `${folderName}/${fileName}`, // 폴더 경로와 결합된 새로운 파일명
        contentLength: file.size,
        contentType: file.mimetype,
      };

      this.logger.log(`PutObjectRequest: ${JSON.stringify(putObjectRequest)}`);
      const response =
        await this.objectStorageClient.putObject(putObjectRequest);
      this.logger.log(`File uploaded successfully: ${fileName}`);
      return response;
    } catch (error) {
      this.logger.error('Failed to upload file to Object Storage', error);
      this.logger.error(`Error Details: ${error.message}`);
      throw error;
    }
  }
}
