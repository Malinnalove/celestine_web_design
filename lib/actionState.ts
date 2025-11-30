export type ActionState = {
  success: boolean;
  message: string | null;
};

export const actionInitialState: ActionState = {
  success: false,
  message: null,
};

