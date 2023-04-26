import { XXHash32 } from "ts-xxhash";

class LinkHashes {
    private linksInfo: Record<string, number> = {};

    ensureHashGenerated(link: string, data: Uint8Array) {
        if (!this.linksInfo[link]) {
            this.linksInfo[link] = XXHash32.hash(0, data).toNumber();
        }
    }

    isSame(link: string, data: Uint8Array) {
        const fileHash = XXHash32.hash(0, data).toNumber();
        return this.linksInfo[link] == fileHash;
    }
}

export const linkHashes = new LinkHashes();
