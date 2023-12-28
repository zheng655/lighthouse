/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/** @type {LH.Config} */
const config = {
  extends: 'lighthouse:default',
  settings: {
    throttlingMethod: 'devtools',
    // preload-fonts isn't a performance audit, but can easily leverage the font
    // webpages present here, hence the inclusion of 'best-practices'.
    onlyCategories: ['performance', 'best-practices'],

    // BF cache will request the page again, initiating additional network requests.
    // Disable the audit so we only detect requests from the normal page load.
    skipAudits: ['bf-cache'],

    // A mixture of under, over, and meeting budget to exercise all paths.
    budgets: [{
      path: '/',
      resourceCounts: [
        {resourceType: 'total', budget: 8},
        {resourceType: 'stylesheet', budget: 1}, // meets budget
        {resourceType: 'image', budget: 1},
        {resourceType: 'media', budget: 0},
        {resourceType: 'font', budget: 2}, // meets budget
        {resourceType: 'script', budget: 1},
        {resourceType: 'document', budget: 0},
        {resourceType: 'other', budget: 1},
        {resourceType: 'third-party', budget: 0},
      ],
      resourceSizes: [
        {resourceType: 'total', budget: 100},
        {resourceType: 'stylesheet', budget: 0},
        {resourceType: 'image', budget: 30}, // meets budget
        {resourceType: 'media', budget: 0},
        {resourceType: 'font', budget: 75},
        {resourceType: 'script', budget: 30},
        {resourceType: 'document', budget: 1},
        {resourceType: 'other', budget: 2}, // meets budget
        {resourceType: 'third-party', budget: 0},
      ],
      timings: [
        {metric: 'first-contentful-paint', budget: 2000},
        {metric: 'interactive', budget: 2000},
        {metric: 'first-meaningful-paint', budget: 2000},
        {metric: 'max-potential-fid', budget: 2000},
      ],
    }],
  },
};

/**
 * @type {Smokehouse.ExpectedRunnerResult}
 * Expected Lighthouse audit values for testing budgets.
 */
const expectations = {
  networkRequests: {
    // DevTools loads the page three times, so this request count will not be accurate.
    _excludeRunner: 'devtools',
    length: 8,
  },
  lhr: {
    requestedUrl: 'http://localhost:10200/perf/perf-budgets/load-things.html',
    finalDisplayedUrl: 'http://localhost:10200/perf/perf-budgets/load-things.html',
    audits: {
      'resource-summary': {
        score: null,
        details: {
          items: [
            {resourceType: 'total', requestCount: 10, transferSize: '166472±1000'},
            {resourceType: 'font', requestCount: 2, transferSize: '81096±1000'},
            {resourceType: 'script', requestCount: 3, transferSize: '53615±1000'},
            {resourceType: 'image', requestCount: 2, transferSize: '28359±1000'},
            {resourceType: 'document', requestCount: 1, transferSize: '1776±150'},
            {resourceType: 'other', requestCount: 1, transferSize: '1085±100'},
            {resourceType: 'stylesheet', requestCount: 1, transferSize: '528±100'},
            {resourceType: 'media', requestCount: 0, transferSize: 0},
            {resourceType: 'third-party', requestCount: 0, transferSize: 0},
          ],
        },
      },
      'performance-budget': {
        score: null,
        details: {
          // Undefined items are asserting that the property isn't included in the table item.
          items: [
            {
              resourceType: 'total',
              countOverBudget: '2 requests',
              sizeOverBudget: '64121±1000',
            },
            {
              resourceType: 'script',
              countOverBudget: '2 requests',
              sizeOverBudget: '22450±1000',
            },
            {
              resourceType: 'font',
              countOverBudget: undefined,
              sizeOverBudget: '4296±500',
            },
            {
              resourceType: 'document',
              countOverBudget: '1 request',
              sizeOverBudget: '759±50',
            },
            {
              resourceType: 'stylesheet',
              countOverBudget: undefined,
              sizeOverBudget: '528±100',
            },
            {
              resourceType: 'image',
              countOverBudget: '1 request',
              sizeOverBudget: undefined,
            },
            {
              resourceType: 'media',
              countOverBudget: undefined,
              sizeOverBudget: undefined,
            },
            {
              resourceType: 'other',
              countOverBudget: undefined,
              sizeOverBudget: undefined,
            },
            {
              resourceType: 'third-party',
              countOverBudget: undefined,
              sizeOverBudget: undefined,
            },
          ],
        },
      },
    },
  },
};

export default {
  id: 'perf-budgets',
  expectations,
  config,
  runSerially: true,
};
