// Contracts:
const GeneralSale = artifacts.require("./GeneralSale.sol");
const SHP = artifacts.require("./SHP.sol");
const AffiliateUtility = artifacts.require("./AffiliateUtility.sol");
const DynamicCeiling = artifacts.require("./DynamicCeiling.sol");
const Presale = artifacts.require("./SHP.sol");
const SHPController = artifacts.require("./SHPController.sol");
const TokenSale = artifacts.require("./TokenSale.sol");
const MiniMeToken = artifacts.require("./MiniMeToken.sol");
const Owned = artifacts.require("./Owned.sol");
const SafeMath = artifacts.require("./SafeMath.sol");
const Trustee = artifacts.require("./Trustee.sol");
const MultiSigWallet = artifacts.require("./MultiSigWallet");

// Addresses
const masterAddress = '0x167b7133b1CAa3ce98A911dF67C3f760889A37be';
const escrowSignAddress = '0x0f586d0a27E28784312245a11b66F3011a0af27C';
const bountySignAddress = `0x7620DA4995f170314b71421E2b22111FEF0E6f97`;
const foundersSignAddress = `0x3Ec07aee1F9d104C9C930e41BE0f523446c49490`;
const reserveSignAddress = `0xFC553eA109CF4b8fbD0174d6395f1319C71A88ee`;

// Ether to Dollar Value
const etherPeggedValue = 400;

// Affiliate Tiers
const affiliateTierTwo = web3.toWei(1) * (3000 / 300);
const affiliateTierThree = web3.toWei(1) * (6000 / 300);

//PRESALE VALUSE:
const MIN_PRESALE_CONTRIBUTION = 10000;
const MAX_PRESALE_CONTRIBUTION = 1000000;
const FIRST_TIER_DISCOUNT_UPPER_LIMIT = 49999;
const SECOND_TIER_DISCOUNT_UPPER_LIMIT = 249999;
const THIRD_TIER_DISCOUNT_UPPER_LIMIT = 1000000;
const PRESALE_CAP = 10000000;
const honourWhitelistEnd = new Date(2017, 10, 9, 9, 0, 0, 0).getTime();

//GENEARL SALE VALUES
const MIN_GENERAL_SALE_CONTRIBUTION = 100;
const MAX_GENERAL_SALE_CONTRIBUTION = 1000;
const GENERAL_SALE_HARDCAP = 4400;



module.exports = async function(deployer, network, accounts) {

    console.log("__________________________________________")
    console.log("*************Begin Migration**************")
    console.log("__________________________________________")
    console.log("deploying on network: " + network);


    if (network === "development") {
        return;
    }

    //SHP Token
    let miniMeTokenFactory = await MiniMeTokenFactory.new();
    let shp = await SHP.new(miniMeTokenFactory.address);

    //General Setup
    let etherEscrowWallet = await MultiSigWallet.new([escrowSignAddress], 1);
    let bountyWallet = await MultiSigWallet.new([bountySignAddress], 1);
    let foundersWallet = await MultiSigWallet.new([foundersSignAddress], 1);
    let reserveWallet = await MultiSigWallet.new([reserveSignAddress], 1);
    let trusteeWallet = await Trustee.new(shp.address);
    let shpController = await SHPController.new(reserveAddress, foundersAddress);
    let affiliateUtility = await AffiliateUtility.new(affiliateTierTwo, affiliateTierThree);

    let etherEscrowAddress = await etherEscrowWallet.address;
    let foundersAddress = await foundersWallet.address;
    let reserveAddress = await reserveWallet.address;
    let bountyAddress = await bountyWallet.address;
    let trusteeAddress = await trusteeWallet.address;
    let shpControllerAddress = await shpController.address;
    let affiliateUtilityAddress = await affiliateUtility.address;
    let shpAddress = await shp.address;

    //SHP Controller
    await shpController.setContracts(shp.address, trusteeAddress);

    //Presale
    let presale = await Presale.new(
        etherEscrowAddress,
        bountyWalletAddress,
        trusteeWalletAddress,
        affiliateUtilityAddress,
        web3.toWei(FIRST_TIER_DISCOUNT_UPPER_LIMIT / etherPeggedValue),
        web3.toWei(SECOND_TIER_DISCOUNT_UPPER_LIMIT / etherPeggedValue),
        web3.toWei(THIRD_TIER_DISCOUNT_UPPER_LIMIT / etherPeggedValue),
        web3.toWei(MIN_PRESALE_CONTRIBUTION / etherPeggedValue),
        web3.toWei(this.MAX_PRESALE_CONTRIBUTION / etherPeggedValue),
        preSaleCap,
        honourWhitelistEnd
    );
    let presaleAddress = await presale.address;

    /// MOVE THIS
    // await trusteeWallet.changeOwner(preSaleAddress);
    // await shp.changeController(preSaleAddress);
    // await preSale.setShp(shpAddress);

    // General Sale
    let minContributionInWei = web3.toWei(MIN_GENERAL_SALE_CONTRIBUTION / etherPeggedValue);
   
    let generalSale = await GeneralSale.new(
        etherEscrowWalletAddress,
        bountyWalletAddress,
        trusteeWalletAddress,
        affiliateUtilityAddress,
        minContributionInWei);
    
    let generalSaleAddress = await generalSale.address;

    let dynamicCeiling = await DynamicCeiling.new(masterAddress,generalSaleAddress);
    let dynamicCeilingAddress = await dynamicCeiling.address;

    await generalSale.setDynamicCeilingAddress(dynamicCeiling.address);

    // Log all addresses:
    console.log("__________________________________________")
    console.log("********Completed Deploying Contracts*****")
    console.log("__________________________________________")
    console.log("Ether Escrow Wallet" + " has been deployed to: " + etherEscrowAddress);
    console.log("bountyWallet" + " has been deployed to: " + bountyWalletAddress );
    console.log("Founders Wallet" + " has been deployed to: " + foundersAddress);
    console.log("Reserve Wallet" + " has been deployed to: " + reserveAddress );
    console.log("Trustee Wallet" + " has been deployed to: " + trusteeWallet );
    console.log("SHPController" + " has been deployed to: " + shpControllerAddress);
    console.log("AffiliateUtility" + " has been deployed to: " + affiliateUtilityAddress);
    console.log("SHP" + "has been deployed to: " + shpAddress);
    console.log("PreSale" + " has been deployed to: " + presaleAddress );
    console.log("GeneralSale" + " has been deployed to: " + generalSaleAddress);
    console.log("Dynamic Ceiling" + " has been deployed to: " + dynamicCeilingAddress);
    console.log("__________________________________________")
    console.log("__________________________________________")
};