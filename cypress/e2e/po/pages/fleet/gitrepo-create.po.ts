import PagePo from '@/cypress/e2e/po/pages/page.po';
import { SharedComponentsPo } from '@/cypress/e2e/po/components/shared-components/shared-components.po';
import ArrayListPo from '@/cypress/e2e/po/components/array-list.po';
import LabeledInputPo from '@/cypress/e2e/po/components/labeled-input.po';
import LabeledSelectPo from '@/cypress/e2e/po/components/labeled-select.po';
import SelectOrCreateAuthPo from '@/cypress/e2e/po/components/select-or-create-auth.po';
import { FleetGitRepoListPagePo } from '@/cypress/e2e/po/pages/fleet/fleet.cattle.io.gitrepo.po';

export class GitRepoCreatePo extends PagePo {
  static url: string;

  private static createPath(
    clusterId: string,
    queryParams?: Record<string, string>
  ) {
    const urlStr = `/c/${ clusterId }/fleet/fleet.cattle.io.gitrepo/create`;

    if (!queryParams) {
      return urlStr;
    }

    const params = new URLSearchParams(queryParams);

    return `${ urlStr }?${ params.toString() }`;
  }

  static goTo(clusterId = 'local'): Cypress.Chainable<Cypress.AUTWindow> {
    return super.goTo(GitRepoCreatePo.createPath(clusterId));
  }

  constructor(clusterId: string) {
    super(GitRepoCreatePo.createPath(clusterId));
  }

  static navTo() {
    const listPage = new FleetGitRepoListPagePo();

    listPage.navTo();
    listPage.sharedComponents().resourceDetail().createEditView().create();
  }

  sharedComponents() {
    return new SharedComponentsPo(this.self());
  }

  setBranchName(branch = 'dashboard-e2e-basic') {
    return LabeledInputPo.byLabel(this.self(), 'Branch').set(branch);
  }

  setGitRepoUrl(url: string) {
    return LabeledInputPo.byLabel(this.self(), 'Repository URL').set(url);
  }

  setHelmRepoURLRegex(regexStr = 'https://charts.rancher.io/*') {
    return LabeledInputPo.bySelector(this.self(), '[data-testid="gitrepo-helm-repo-url-regex"]').set(regexStr);
  }

  setGitRepoPath(path: string, index = 0) {
    return this.gitRepoPaths().setValueAtIndex(path, index);
  }

  targetCluster(): LabeledSelectPo {
    return new LabeledSelectPo('[data-testid="fleet-gitrepo-target-cluster"]');
  }

  gitRepoPaths() {
    return new ArrayListPo('[data-testid="gitRepo-paths"]');
  }

  authSelectOrCreate(selector: string) {
    return new SelectOrCreateAuthPo(selector);
  }

  helmAuthSelectOrCreate() {
    return this.authSelectOrCreate('[data-testid="gitrepo-git-auth"]');
  }

  gitAuthSelectOrCreate() {
    return this.authSelectOrCreate('[data-testid="gitrepo-helm-auth"]');
  }

  setPollingInterval(value: number) {
    return LabeledInputPo.byLabel(this.self(), 'Polling Interval').set(value);
  }

  displayAlwaysKeepInformationMessage() {
    this.self().get('[data-testid="checkbox-info-icon"]').eq(0).as('always');

    cy.get('@always').realHover();
    cy.get('@always').should('have.attr', 'data-popper-shown');
  }

  displayPollingInvervalTimeInformationMessage() {
    this.self().get('[data-testid="checkbox-info-icon"]').eq(1).as('polling');

    cy.get('@polling').realHover();
    cy.get('@polling').should('have.attr', 'data-popper-shown');
  }

  displaySelfHealingInformationMessage() {
    this.self().get('[data-testid="labeledTooltip-info-icon"]').eq(0).as('selfhealingicon');

    cy.get('@selfhealingicon').realHover();
    cy.get('@selfhealingicon').should('have.attr', 'data-popper-shown');
  }
}
