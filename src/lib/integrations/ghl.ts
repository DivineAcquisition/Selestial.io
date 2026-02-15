interface GHLConfig {
  apiKey: string
  locationId: string
}

export async function ghlRequest(
  config: GHLConfig,
  endpoint: string,
  method: string = 'GET',
  body?: Record<string, unknown>
) {
  const response = await fetch(`https://services.leadconnectorhq.com${endpoint}`, {
    method,
    headers: {
      'Authorization': `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json',
      'Version': '2021-07-28',
    },
    body: body ? JSON.stringify(body) : undefined,
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`GHL API error ${response.status}: ${error}`)
  }

  return response.json()
}

export async function movePipelineStage(
  config: GHLConfig,
  contactId: string,
  pipelineId: string,
  stageId: string,
  contactName: string
) {
  return ghlRequest(config, '/opportunities/', 'POST', {
    pipelineId,
    stageId,
    contactId,
    locationId: config.locationId,
    name: contactName,
    status: 'open',
  })
}

export async function addTag(config: GHLConfig, contactId: string, tags: string[]) {
  return ghlRequest(config, `/contacts/${contactId}/tags`, 'POST', { tags })
}

export async function removeTag(config: GHLConfig, contactId: string, tags: string[]) {
  return ghlRequest(config, `/contacts/${contactId}/tags`, 'DELETE', { tags })
}

export async function createTask(
  config: GHLConfig,
  contactId: string,
  title: string,
  description: string,
  dueDate: string
) {
  return ghlRequest(config, `/contacts/${contactId}/tasks`, 'POST', {
    title,
    body: description,
    dueDate,
    completed: false,
  })
}

export async function addNote(config: GHLConfig, contactId: string, body: string) {
  return ghlRequest(config, `/contacts/${contactId}/notes`, 'POST', { body })
}
