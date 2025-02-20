export const creageLegacyFullMessage = (params: {
  address?: string;
  application?: string;
  chainId?: string;
  message: string;
  nonce?: string;
}) => {
  let fullMessage = "APTOS";
  if (params.address) {
    fullMessage += `\naddress: ${params.address}`;
  }
  if (params.application) {
    fullMessage += `\napplication: ${params.application}`;
  }
  if (params.chainId) {
    fullMessage += `\nchainId: ${params.chainId}`;
  }
  fullMessage += `\nmessage: ${params.message}`;
  if (params.nonce) {
    fullMessage += `\nnonce: ${params.nonce}`;
  }
  return fullMessage;
};
