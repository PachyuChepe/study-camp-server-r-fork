// object-storage.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as common from 'oci-common';
import * as objectStorage from 'oci-objectstorage';
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
      const configFilePath = this.configService.get<string>('OCI_CONFIG_FILE');
      if (!configFilePath) {
        throw new Error('OCI_CONFIG_FILE is not defined in .env file');
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

  async uploadFile(file: Express.Multer.File): Promise<string> {
    try {
      const folderName = 'Study-Camp-Space-Img';
      const timestamp = moment().format('YYYY-MM-DD-HH:mm:ss');
      const fileName = `${timestamp}-Space-${file.originalname}`;

      this.logger.log(
        `Uploading file: ${file.originalname} as ${fileName} to folder: ${folderName}`,
      );

      // 파일 버퍼의 길이를 로그로 출력하여 확인
      this.logger.log(`File buffer length: ${file.buffer.length}`);

      // 버퍼 내용 일부를 로그로 출력 (예: 앞 20바이트)
      this.logger.log(
        `File buffer content preview: ${file.buffer.slice(0, 20).toString('hex')}`,
      );

      const putObjectRequest: objectStorage.requests.PutObjectRequest = {
        namespaceName: this.namespace,
        bucketName: this.bucketName,
        putObjectBody: file.buffer, // 파일 데이터를 그대로 사용
        objectName: `${folderName}/${fileName}`,
        contentLength: file.size,
        contentType: file.mimetype, // 정확한 MIME 타입 설정
      };

      const response =
        await this.objectStorageClient.putObject(putObjectRequest);
      this.logger.log(`File uploaded successfully: ${fileName}`);

      return `${folderName}/${fileName}`; // 저장된 파일 경로를 반환
    } catch (error) {
      this.logger.error('Failed to upload file to Object Storage', error);
      throw error;
    }
  }

  public async createPAR(objectName: string): Promise<string> {
    try {
      const objectPath = objectName; // 업로드된 파일의 경로

      const parDetails: objectStorage.models.CreatePreauthenticatedRequestDetails =
        {
          name: `PAR for ${objectPath}`,
          objectName: objectPath,
          accessType: 'ObjectRead' as any, // AccessType 설정
          timeExpires: new Date(Date.now() + 24 * 60 * 60 * 1000 * 365), // 1년 후 만료
        };

      const createParRequest: objectStorage.requests.CreatePreauthenticatedRequestRequest =
        {
          namespaceName: this.namespace,
          bucketName: this.bucketName,
          createPreauthenticatedRequestDetails: parDetails,
        };

      const createParResponse =
        await this.objectStorageClient.createPreauthenticatedRequest(
          createParRequest,
        );

      const parUrl = `https://objectstorage.${this.configService.get<string>('OCI_REGION')}.oraclecloud.com${createParResponse.preauthenticatedRequest.accessUri}`;
      this.logger.log(`PAR URL created: ${parUrl}`);

      return parUrl;
    } catch (error) {
      this.logger.error('Failed to create PAR URL', error);
      throw error;
    }
  }
}
