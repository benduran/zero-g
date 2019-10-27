
import { ZeroGInstance } from './zeroG';

export class DockingProcedureInstance {
  constructor(private zeroGInstances: ZeroGInstance[]) {}
}

export default function createDockingProcedure(zeroGInstances: ZeroGInstance[]) {
  if (!Array.isArray(zeroGInstances) || !zeroGInstances.length) throw new Error('Unable to create docking procedure. At least one zero-g instance is needed.');
  const dockingProcedureInstance = new DockingProcedureInstance(zeroGInstances);
  return dockingProcedureInstance;
}
