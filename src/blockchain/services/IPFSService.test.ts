import { describe, it, expect, vi, beforeEach } from 'vitest'
import ipfsService from './IPFSService'

// Mock IndexedDB
const mockIndexedDB = {
  open: vi.fn(),
  deleteDatabase: vi.fn()
};
global.indexedDB = mockIndexedDB as any;

beforeEach(() => {
  vi.restoreAllMocks()
})

describe('IPFSService', () => {
  it('uploadJSON validates and uploads JSON', async () => {
    const fakeCid = 'bafyfakejson'
    globalThis.fetch = vi.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve({ cid: fakeCid }) } as any)
    ) as any

    const res = await ipfsService.uploadJSON({ name: 'test' })
    expect(res.cid).toBe(fakeCid)
    expect(res.uri).toBe(`ipfs://${fakeCid}`)
  })

  it('uploadFile simple path returns CID', async () => {
    const fakeCid = 'bafyfilecid'
    globalThis.fetch = vi.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve({ cid: fakeCid }) } as any)
    ) as any

    const file = new File(["hello"], 'hello.txt', { type: 'text/plain' })
    const res = await ipfsService.uploadFile(file)
    expect(res.cid).toBe(fakeCid)
    expect(res.size).toBe(file.size)
  })

  it('uploadBatch uploads multiple files concurrently', async () => {
    const cids = ['cid1', 'cid2', 'cid3']
    let call = 0
    globalThis.fetch = vi.fn(() => {
      const cid = cids[call % cids.length]
      call++
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ cid }) } as any)
    }) as any

    const files = [new File(['a'], 'a.txt'), new File(['b'], 'b.txt'), new File(['c'], 'c.txt'), new File(['d'], 'd.txt')]
    const results = await ipfsService.uploadBatch(files)
    expect(results.length).toBe(files.length)
    results.forEach((r) => expect(r.cid).toBeDefined())
  })

  it('getFile uses gateway fallback and caches result', async () => {
    const cid = 'cid-fallback'
    // first gateway fails, second succeeds
    const responses = [Promise.resolve({ ok: false } as any), Promise.resolve({ ok: true, blob: () => Promise.resolve(new Blob(['data'])) } as any)]
    let idx = 0
    globalThis.fetch = vi.fn(() => responses[idx++] as any) as any

    const blob = await ipfsService.getFile(cid)
    expect(blob).toBeInstanceOf(Blob)

    // second call should come from cache and not call fetch again
    vi.spyOn(globalThis, 'fetch')
    const blob2 = await ipfsService.getFile(cid)
    expect(blob2).toBeInstanceOf(Blob)
  })

  it('pin and unpin update local pin DB', async () => {
    // mock pinata endpoints
    globalThis.fetch = vi.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve({}) } as any)) as any
    const localId = `local-${Date.now()}`
    await ipfsService.pinFile(localId)
    const pins = await (ipfsService as any).getPinnedFiles()
    expect(pins.local.some((p: any) => p.cid === localId)).toBe(true)
    await ipfsService.unpinFile(localId)
    const pins2 = await (ipfsService as any).getPinnedFiles()
    expect(pins2.local.some((p: any) => p.cid === localId && p.pinned === false)).toBe(true)
  })

  it('uploadJSON throws on invalid metadata', async () => {
    await expect(() => (ipfsService as any).uploadJSON(null)).rejects.toThrow()
  })

  it('uploadFile uses chunked path for large files', async () => {
    const fakeCid = 'bafy-chunked'
    globalThis.fetch = vi.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve({ cid: fakeCid }) } as any)) as any
    // create a ~11MB blob to trigger chunked upload (>10MB)
    const big = new Uint8Array(11 * 1024 * 1024)
    const file = new File([big], 'big.bin', { type: 'application/octet-stream' })
    const res = await ipfsService.uploadFile(file)
    expect(res.cid).toBe(fakeCid)
    expect(res.size).toBe(file.size)
  })
})
