import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as common from 'oci-common';
import * as objectStorage from 'oci-objectstorage';
import { requests } from 'oci-objectstorage';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { execSync } from 'child_process';

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
      const configFileContent = `
[DEFAULT]
user=${this.configService.get<string>('OCI_USER')}
fingerprint=${this.configService.get<string>('OCI_FINGERPRINT')}
tenancy=${this.configService.get<string>('OCI_TENANCY')}
region=${this.configService.get<string>('OCI_REGION')}
key_file=${this.configService.get<string>('OCI_KEY_FILE')}
`;

      this.logger.log(`Config file content:\n${configFileContent}`);

      // 구성 파일을 작성
      // fs.writeFileSync(configFilePath, configFileContent);
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
      // fs.writeFileSync(apiKeyFilePath, apiKeyContent);
      fs.writeFileSync(apiKeyFilePath, apiKeyContent.replace(/\r\n/g, '\n')); // 줄바꿈 문자 처리
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

  private checkAndInstallAcl() {
    try {
      // Check if ACL is installed
      execSync('which setfacl', { stdio: 'ignore' });
      this.logger.log('ACL is already installed.');
    } catch {
      this.logger.log('ACL is not installed. Installing...');
      this.installAcl();
    }
  }

  private installAcl() {
    try {
      const platform = os.platform();
      let installCommand = '';

      if (platform === 'linux') {
        try {
          // Read distribution info from /etc/os-release
          const osReleaseContent = fs.readFileSync('/etc/os-release', 'utf8');
          const lines = osReleaseContent.split('\n');
          let distro = '';
          for (const line of lines) {
            if (line.startsWith('ID=')) {
              distro = line
                .split('=')[1]
                .replace(/"/g, '')
                .trim()
                .toLowerCase();
              break;
            }
          }

          if (distro === 'ubuntu' || distro === 'debian') {
            installCommand = 'sudo apt-get install -y acl';
          } else if (distro === 'centos' || distro === 'redhat') {
            installCommand = 'sudo yum install -y acl';
          } else {
            this.logger.warn(
              'Unsupported Linux distribution detected for ACL installation.',
            );
            return;
          }

          this.logger.log(`Running: ${installCommand}`);
          execSync(installCommand, { stdio: 'inherit' });
          this.logger.log('ACL installation completed successfully.');
        } catch (distroError) {
          this.logger.error(
            'Failed to determine the Linux distribution for ACL installation',
            distroError,
          );
        }
      } else {
        this.logger.log(
          'Non-Linux platform detected. ACL installation is not supported.',
        );
      }
    } catch (error) {
      this.logger.error('Failed to install ACL', error);
    }
  }

  private setPermissions(filePath: string) {
    const platform = os.platform();

    if (platform === 'win32') {
      try {
        this.logger.log(`Setting permissions for Windows on file: ${filePath}`);
        // 권한 설정
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
      this.checkAndInstallAcl(); // Ensure ACL is installed

      try {
        fs.chmodSync(filePath, '600');
        // ACL 설정
        execSync(`setfacl -m u::rw ${filePath}`);
        execSync(`setfacl -m g::--- ${filePath}`);
        execSync(`setfacl -m o::--- ${filePath}`);
        // this.logger.log(`ACL permissions set for Linux/macOS file: ${filePath}`);
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
      this.logger.log(`Uploading file: ${file.originalname}`);
      const putObjectRequest: requests.PutObjectRequest = {
        namespaceName: this.namespace,
        bucketName: this.bucketName,
        putObjectBody: file.buffer,
        objectName: file.originalname,
        contentLength: file.size,
        contentType: file.mimetype,
      };

      this.logger.log(`PutObjectRequest: ${JSON.stringify(putObjectRequest)}`);
      const response =
        await this.objectStorageClient.putObject(putObjectRequest);
      this.logger.log(`File uploaded successfully: ${file.originalname}`);
      return response;
    } catch (error) {
      this.logger.error('Failed to upload file to Object Storage', error);
      this.logger.error(`Error Details: ${error.message}`);
      throw error;
    }
  }
}
