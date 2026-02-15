interface TelnyxConfig {
  apiKey: string
  phoneNumber: string
}

export async function telnyxRequest(
  config: TelnyxConfig,
  endpoint: string,
  method: string = 'POST',
  body?: Record<string, unknown>
) {
  const response = await fetch(`https://api.telnyx.com/v2${endpoint}`, {
    method,
    headers: {
      'Authorization': `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Telnyx API error ${response.status}: ${error}`)
  }

  return response.json()
}

export async function sendSMS(config: TelnyxConfig, to: string, text: string) {
  return telnyxRequest(config, '/messages', 'POST', {
    from: config.phoneNumber,
    to,
    text,
  })
}

export async function initiateCall(config: TelnyxConfig, to: string, webhookUrl: string) {
  return telnyxRequest(config, '/calls', 'POST', {
    connection_id: config.phoneNumber,
    to,
    from: config.phoneNumber,
    webhook_url: webhookUrl,
  })
}
