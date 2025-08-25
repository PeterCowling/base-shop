export const setApiKey = jest.fn();
export const send = jest.fn();

const sendgridMailMock = { setApiKey, send };
export default sendgridMailMock;
