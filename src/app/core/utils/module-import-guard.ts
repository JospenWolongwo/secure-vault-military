import { throwError as _throw } from 'rxjs';

/**
 * Throws an error if the parent injector does not exist when getting an optional dependency.
 * This is used to prevent multiple instances of CoreModule from being loaded.
 * @param parentModule The parent module
 * @param moduleName The name of the module
 */
export function throwIfAlreadyLoaded(parentModule: any, moduleName: string): void {
  if (parentModule) {
    const msg = `${moduleName} has already been loaded. Import ${moduleName} in the AppModule only.`;
    _throw(new Error(msg));
  }
}
