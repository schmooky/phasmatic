import 'reflect-metadata';
import { PHASE_REGISTRY } from './types';
import { PhasmaticSelfTransitionError } from './errors';
/**
 * Phase decorator - registers a method as a state handler
 * @param phaseName The name of the phase this method handles
 */
export function Phase(phaseName) {
    return function (target, propertyKey, descriptor) {
        // Get the return type from the method's metadata
        const returnType = Reflect.getMetadata('design:returntype', target, propertyKey);
        // Extract possible next phases from the return type
        // This uses TypeScript's built-in type system
        const possibleNextPhases = extractPossibleNextPhases(returnType);
        // Ensure the phase can't transition to itself
        if (possibleNextPhases.includes(phaseName)) {
            throw new PhasmaticSelfTransitionError(`Phase ${phaseName} cannot transition to itself. This would create an infinite loop.`);
        }
        // Get or create the registry on the class prototype
        if (!target.constructor[PHASE_REGISTRY]) {
            target.constructor[PHASE_REGISTRY] = new Map();
        }
        // Add this phase to the registry
        target.constructor[PHASE_REGISTRY].set(phaseName, {
            name: phaseName,
            handler: descriptor.value,
            possibleNextPhases
        });
        return descriptor;
    };
}
/**
 * Extract possible next phases from a TypeScript return type
 * This is a helper that works with the TypeScript compiler API
 */
function extractPossibleNextPhases(returnType) {
    // For Promise<T> types, we extract the T
    if (returnType?.name === 'Promise') {
        const typeArgs = Reflect.getMetadata('design:paramtypes', returnType);
        if (typeArgs && typeArgs.length > 0) {
            return extractPossibleNextPhases(typeArgs[0]);
        }
    }
    // For union types (T1 | T2 | T3)
    if (returnType?.types) {
        return returnType.types.flatMap(extractPossibleNextPhases);
    }
    // For literal types (string literals)
    if (typeof returnType === 'string') {
        return [returnType];
    }
    // For enum values 
    if (typeof returnType === 'object' && returnType !== null) {
        return Object.values(returnType);
    }
    return [];
}
//# sourceMappingURL=decorators.js.map