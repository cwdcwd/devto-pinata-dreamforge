import * as crypto from "crypto";


const PINATA_JWT = process.env.PINATA_JWT ?? ''
const GROUP_ID = process.env.GROUP_ID ?? '019276f5-846c-71e0-bf02-8adcf65e9007'
const API_URL = process.env.API_URL ?? 'https://api.pinata.cloud'
const UPLOAD_URL = process.env.UPLOAD_URL ?? 'https://uploads.pinata.cloud'
const GATEWAY_URL = process.env.PINTATA_GATEWAY ?? ''


function formatTime(milliseconds: number): string {
  const seconds = milliseconds / 1000;
  return `${seconds.toFixed(2)} s`;
}

(async function main() {
  const startTime = performance.now();
  const JWT = PINATA_JWT;

  const testAuthRequest = await fetch(
    `${API_URL}/data/testAuthentication`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${JWT}`,
      },
    },
  );
  const testAuth = await testAuthRequest.json();
  const authEndTime = performance.now();
  const authTime = authEndTime - startTime;
  console.log("Auth Status: ", testAuth);
  console.log("Auth Time: ", formatTime(authTime));

  const uuid = crypto.randomUUID();
  const file = new File([uuid.toString()], `${uuid}.txt`, {
    type: "text/plain",
  });
  const formData = new FormData();
  formData.append("file", file);
  formData.append("group_id", GROUP_ID!);
  const uploadStart = performance.now();
  const uploadRequest = await fetch(`${UPLOAD_URL}/v3/files`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${JWT}`,
    },
    body: formData,
  });
  const upload = await uploadRequest.json()
  const uploadFinish = performance.now();
  const uploadTime = uploadFinish - uploadStart;
  console.log("Upload Status: ", upload);
  console.log("Upload Time: ", formatTime(uploadTime));

  const fetchStart = performance.now();
  const data = await fetch(
    `https://${GATEWAY_URL}/files/${upload.data.cid}`,
  );
  const fetchFinish = performance.now();
  const fetchTime = fetchFinish - fetchStart;
  console.log("Fetch Status: ", data.statusText);
  console.log("Fetch Time: ", formatTime(fetchTime));

  const signedUrlReq = await fetch(`${API_URL}/v3/files/sign`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${JWT}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      url: `https://${GATEWAY_URL}/files/${upload.data.cid}`,
      expires: 30,
      date: Date.now(),
      method: "GET"
    })
  })
  const signedUrlRes = await signedUrlReq.json()
  const fetchSigned = await fetch(signedUrlRes.data)
  console.log("Signed URL Status: ",fetchSigned.status)

  const deleteReq = await fetch(`${API_URL}/v3/files/${upload.data.id}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${JWT}`
      }
    })
  const deleteRes = await deleteReq.json()
  console.log("Delete status: ", deleteReq.status)
})();