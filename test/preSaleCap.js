const assertFail = require("./helpers/assertFail");
const assertions = require("./helpers/assertions");
const eventsUtil = require("./helpers/eventsUtil");
const testConfig = require("./helpers/testConfig");

contract("Presale cap/limits", function(accounts) {

    before(async function() {
        await testConfig.setup(accounts);
    });

    it('should initialize contract with expected values', async function() {
        await assertions.expectedInitialisation(
            testConfig.preSale, 
            {
                etherEscrowWallet: testConfig.etherEscrowWallet,
                reserveWallet: testConfig.reserveWallet,
                foundersWallet: testConfig.foundersWallet
            },
            {
                preSaleBegin: testConfig.preSaleBegin,
                preSaleEnd: testConfig.preSaleEnd,
                preSaleCap: testConfig.preSaleCap,
                minPresaleContributionEther: testConfig.minPresaleContributionEther,
                maxPresaleContributionEther: testConfig.maxPresaleContributionEther,
                firstTierDiscountUpperLimitEther: testConfig.firstTierDiscountUpperLimitEther,
                secondTierDiscountUpperLimitEther: testConfig.secondTierDiscountUpperLimitEther,
                thirdTierDiscountUpperLimitEther: testConfig.thirdTierDiscountUpperLimitEther
            }
        );
    });

    it('should accept valid contribution', async function() {
        await testConfig.preSale.sendTransaction({
            value: testConfig.minPresaleContributionEther,
            from: testConfig.contributorOneAddress
        });
        assertions.ether({
            etherEscrowBalance: 25,
            presaleBalance: 0,
            contributorOneBalance: 75,
            contributorTwoBalance: 100,
            reserveBalance: 0,
            foundersBalance: 0
        });
        await assertions.SHP({
            etherEscrowBalance: 0,
            presaleBalance: 0,
            contributorOneBalance: 55000,
            contributorTwoBalance: 0,
            reserveBalance: 0,
            foundersBalance: 0,
            trusteeBalance: 62500,
            bountyBalance: 12500
        });
        let preSaleEtherPaid = (await testConfig.preSale.preSaleEtherPaid()).toNumber();
        assert.equal(preSaleEtherPaid, web3.toWei(25));
    });

    it('should set the pre-sale cap to 25 ETH', async function() {

        let newPresaleCap = web3.toWei('25', 'ether');
        await testConfig.preSale.setPresaleCap(
            newPresaleCap,
            {
                from: testConfig.ownerAddress
            }
        );
        
        let preSaleCap = (await testConfig.preSale.preSaleCap()).toNumber();
        assert.equal(preSaleCap, web3.toWei(25));

        let gracePeriod = await testConfig.preSale.gracePeriod();
        assert.equal(gracePeriod, false);

        let closed = await testConfig.preSale.closed();
        assert.equal(closed, false);
    });

    it('should not accept contributions over the 25 ETH pre-sale cap', async function() {

        let contribution = web3.toWei('26', 'ether');

        await assertFail(async function() {
            await testConfig.preSale.sendTransaction({
                value: contribution,
                from: testConfig.contributorTwoAddress
            })
        });

        assertions.ether({
            etherEscrowBalance: 25,
            presaleBalance: 0,
            contributorOneBalance: 75,
            contributorTwoBalance: 100,
            reserveBalance: 0,
            foundersBalance: 0
        });
        await assertions.SHP({
            etherEscrowBalance: 0,
            presaleBalance: 0,
            contributorOneBalance: 55000,
            contributorTwoBalance: 0,
            reserveBalance: 0,
            foundersBalance: 0,
            trusteeBalance: 62500,
            bountyBalance: 12500
        });

        let preSaleEtherPaid = (await testConfig.preSale.preSaleEtherPaid()).toNumber();
        assert.equal(preSaleEtherPaid, web3.toWei(25));
    });

    it('should accept last contribution before cap and refund exceeds to sender', async function() {

        let newPresaleCap = web3.toWei('50', 'ether');
        await testConfig.preSale.setPresaleCap(newPresaleCap, {
            from: testConfig.ownerAddress
        });
        
        let contribution = web3.toWei('26', 'ether');
        await testConfig.preSale.sendTransaction({
            value: contribution,
            from: testConfig.contributorTwoAddress
        })
        .then(result => {
            eventsUtil.eventValidator(
                result, 
                {
                    name: "ContributionRefund",
                    args: {
                        etherAmount: web3.toWei('1', 'ether'),
                        _caller: testConfig.contributorTwoAddress
                    }
                }
            );
            eventsUtil.eventValidator(
                result, 
                {
                    name: "PresaleClosed",
                }
            );
        });

        assertions.ether({
            etherEscrowBalance: 50,
            presaleBalance: 0,
            contributorOneBalance: 75,
            contributorTwoBalance: 75,
            reserveBalance: 0,
            foundersBalance: 0
        });
        await assertions.SHP({
            etherEscrowBalance: 0,
            presaleBalance: 0,
            contributorOneBalance: 55000,
            contributorTwoBalance: 55000,
            reserveBalance: 0,
            foundersBalance: 0,
            trusteeBalance: 125000,
            bountyBalance: 25000
        });

        let preSaleEtherPaid = (await testConfig.preSale.preSaleEtherPaid()).toNumber();
        assert.equal(preSaleEtherPaid, web3.toWei(50));
    });

    it('should not accept ETH when pre-sale has been automatically closed', async function() {

        let closed = await testConfig.preSale.closed();
        assert.equal(closed, true);

        let contribution = web3.toWei('25', 'ether');
        await assertFail(async function() {
            await testConfig.preSale.sendTransaction({
                value: contribution,
                from: testConfig.contributorTwoAddress
            })
        });

        assertions.ether({
            etherEscrowBalance: 50,
            presaleBalance: 0,
            contributorOneBalance: 75,
            contributorTwoBalance: 75,
            reserveBalance: 0,
            foundersBalance: 0
        });
        await assertions.SHP({
            etherEscrowBalance: 0,
            presaleBalance: 0,
            contributorOneBalance: 55000,
            contributorTwoBalance: 55000,
            reserveBalance: 0,
            foundersBalance: 0,
            trusteeBalance: 125000,
            bountyBalance: 25000
        });
    });
});