 add-bulk-renewal-3
import { ethers } from 'hardhat'
import { DeployFunction } from 'hardhat-deploy/types'
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { keccak256 } from 'js-sha3'
import { namehash } from 'ethers/lib/utils';

=======
import { Interface } from 'ethers/lib/utils'
import { ethers } from 'hardhat'
import { DeployFunction } from 'hardhat-deploy/types'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

const { makeInterfaceId } = require('@openzeppelin/test-helpers')

function computeInterfaceId(iface: Interface) {
  return makeInterfaceId.ERC165(
    Object.values(iface.functions).map((frag) => frag.format('sighash')),
  )
}
 master

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { getNamedAccounts, deployments, network } = hre
  const { deploy } = deployments
 add-bulk-renewal-3
  const { deployer, owner } = await getNamedAccounts()

  if (!network.tags.use_root) {
    return true
  }

  const root = await ethers.getContract('Root', await ethers.getSigner(owner))
  const registry = await ethers.getContract('ENSRegistry', await ethers.getSigner(owner))
  const resolver = await ethers.getContract('PublicResolver', await ethers.getSigner(owner))
  const registrar = await ethers.getContract('BaseRegistrarImplementation')
  const controller = await ethers.getContract('ETHRegistrarController')
=======
  const { deployer } = await getNamedAccounts()

  const registry = await ethers.getContract('ENSRegistry')
 master

  const bulkRenewal = await deploy('BulkRenewal', {
    from: deployer,
    args: [registry.address],
    log: true,
  })

 add-bulk-renewal-3
  console.log('Temporarily setting owner of eth tld to owner ');
  const tx = await root.setSubnodeOwner('0x' + keccak256('eth'), owner)
  await tx.wait()

  console.log('Set default resolver for eth tld to public resolver');
  const tx111 = await registry.setResolver(namehash('eth'), resolver.address)
  await tx111.wait()

  console.log('Set interface implementor of eth tld for bulk renewal');
  const tx2 = await resolver.setInterface(ethers.utils.namehash('eth'), '0x3150bfba', bulkRenewal.address)
  await tx2.wait()

  console.log('Set interface implementor of eth tld for registrar controller');
  const tx3  = await resolver.setInterface(ethers.utils.namehash('eth'), '0xdf7ed181', controller.address)
  await tx3.wait()

  console.log('Set owner of eth tld back to registrar');
  const tx11 = await root.setSubnodeOwner('0x' + keccak256('eth'), registrar.address)
  await tx11.wait()

=======
  // Only attempt to make resolver etc changes directly on testnets
  if (network.name === 'mainnet') return

  const artifact = await deployments.getArtifact('IBulkRenewal')
  const interfaceId = computeInterfaceId(new Interface(artifact.abi))
  const provider = new ethers.providers.StaticJsonRpcProvider(
    ethers.provider.connection.url,
    {
      ...ethers.provider.network,
      ensAddress: registry.address,
    },
  )
  const resolver = await provider.getResolver('eth')
  if (resolver === null) {
    console.log(
      'No resolver set for .eth; not setting interface for BulkRenewal',
    )
    return
  }
  const resolverContract = await ethers.getContractAt(
    'PublicResolver',
    resolver.address,
  )
  const tx = await resolverContract.setInterface(
    ethers.utils.namehash('eth'),
    interfaceId,
    bulkRenewal.address,
  )
  console.log(
    `Setting BulkRenewal interface ID ${interfaceId} on .eth resolver (tx: ${tx.hash})...`,
  )
  await tx.wait()
 master
  return true
}

func.id = 'bulk-renewal'
 add-bulk-renewal-3
func.tags = ['ethregistrar', 'BulkRenewal']
func.dependencies = ['root', 'registry', 'BaseRegistrarImplementation', 'PublicResolver', 'ETHRegistrarController']

export default func
=======
func.tags = ['BulkRenewal']
func.dependencies = ['registry']

export default func
 master
