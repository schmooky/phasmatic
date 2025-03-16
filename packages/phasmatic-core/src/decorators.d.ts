import 'reflect-metadata';
/**
 * Phase decorator - registers a method as a state handler
 * @param phaseName The name of the phase this method handles
 */
export declare function Phase<T extends string>(phaseName: T): (target: any, propertyKey: string, descriptor: PropertyDescriptor) => PropertyDescriptor;
