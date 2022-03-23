import {
  getHashedName,
  getNameAccountKey,
  NameRegistryState,
} from '@bonfida/spl-name-service'
import { clusterApiUrl, Connection, PublicKey } from '@solana/web3.js'

export default async function handler(req, res) {
  const SOL_TLD_AUTHORITY = new PublicKey(
    '58PwtjSDuFHuUkYjH9BYnnQKHfwo9reZhC2zMJv9JPkx'
  )
  const { username } = req.query 
  const solName = `${username}.sol`
  try {
    const connection = new Connection(clusterApiUrl('mainnet-beta'))
    const hashedName = await getHashedName(username)
    const domainKey = await getNameAccountKey(
      hashedName,
      undefined,
      SOL_TLD_AUTHORITY
    )
    const { registry, nftOwner } = await NameRegistryState.retrieve(connection, domainKey)
    if (registry.owner !== null) {
      res.status(200).json({
        data: {
          exist: true,
          displayname: solName,
          href: `https://explorer.solana.com/address/${registry.owner.toBase58()}`,
        },
      })
    } else {
      // It seems this is unlikely to happen
      // When the name exists, it goes to the error branch
      res.status(200).json({ data: { exist: false, displayname: solName } })
    }
  } catch (error) {
    if (error.message === "Invalid name account provided") {
      res.status(200).json({ data: {exist: false, displayname: solName} })
    } else {
      console.log('Error: ', error)
      res.status(500).json({ error: error.message })
    }
  }
}
