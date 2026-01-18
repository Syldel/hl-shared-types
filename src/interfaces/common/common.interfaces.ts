export type DecimalString = string;

export type Timestamp = number;

export type HexString = `0x${string}`;

// Info : HLOid est l’ID d’un ordre, pas d’un fill ou d’une position
export type HLOid = number | HexString;
