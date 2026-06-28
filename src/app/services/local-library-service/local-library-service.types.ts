export {};

type TFileSystemPermissionMode = 'read' | 'readwrite';

interface IFileSystemPermissionDescriptor {
  mode?: TFileSystemPermissionMode;
}

declare global {
  interface FileSystemHandle {
    queryPermission?(
      descriptor?: IFileSystemPermissionDescriptor,
    ): Promise<PermissionState>;
    requestPermission?(
      descriptor?: IFileSystemPermissionDescriptor,
    ): Promise<PermissionState>;
  }

  interface Window {
    showDirectoryPicker?: (options?: {
      id?: string;
      mode?: TFileSystemPermissionMode;
      startIn?: string;
    }) => Promise<FileSystemDirectoryHandle>;
  }
}
