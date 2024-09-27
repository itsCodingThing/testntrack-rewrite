interface DeepPartialArray<Thing> extends Array<DeepPartial<Thing>> {}

type DeepPartialObject<Thing> = {
    [Key in keyof Thing]?: DeepPartial<Thing[Key]>;
};

export type DeepPartial<Thing> = Thing extends Function
    ? Thing
    : Thing extends Array<infer InferredArrayMember>
    ? DeepPartialArray<InferredArrayMember>
    : Thing extends object
    ? DeepPartialObject<Thing>
    : Thing | undefined;

export type ArrayEleAsType<A> = A extends ReadonlyArray<any> ? A[number] : never;
export type ObjValueAsType<O> = O extends Readonly<any> ? O[keyof O] : never;
