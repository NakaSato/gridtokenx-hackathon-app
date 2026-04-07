#!/usr/bin/env node
/**
 * ML Energy Profile Clustering Test
 * 
 * Tests the WASM-based clustering algorithm for energy profile analysis.
 * This simulates the client-side ML inference that determines user archetypes.
 */

const fs = require('fs');
const path = require('path');

// Test configuration
const TEST_CASES = [
    {
        name: 'Solar Enthusiast Profile',
        characteristics: {
            peak_to_avg_ratio: 3.0,  // High peaks (solar export)
            daytime_ratio: 0.8        // Most energy during day
        },
        expected_cluster: 'solar_enthusiast',
        description: 'High daytime generation, low grid dependency'
    },
    {
        name: 'Night Owl Profile',
        characteristics: {
            peak_to_avg_ratio: 2.5,   // Evening peaks
            daytime_ratio: 0.25       // Most energy at night
        },
        expected_cluster: 'night_owl',
        description: 'Peak consumption during evening/night hours'
    },
    {
        name: 'Energy Saver Profile',
        characteristics: {
            peak_to_avg_ratio: 1.0,   // Low, consistent usage
            daytime_ratio: 0.55       // Balanced day/night
        },
        expected_cluster: 'energy_saver',
        description: 'Consistent low consumption, minimal peaks'
    },
    {
        name: 'Home Worker Profile',
        characteristics: {
            peak_to_avg_ratio: 1.75,  // Moderate peaks
            daytime_ratio: 0.7        // Higher daytime usage
        },
        expected_cluster: 'home_worker',
        description: 'Steady daytime consumption pattern'
    },
    {
        name: 'Industrial User Profile',
        characteristics: {
            peak_to_avg_ratio: 4.0,   // Very high peaks
            daytime_ratio: 0.6        // High daytime industrial load
        },
        expected_cluster: 'industrial',
        description: 'High reactive power, consistent baseload'
    },
    {
        name: 'Edge Case - Perfect Balance',
        characteristics: {
            peak_to_avg_ratio: 1.0,   // Perfectly flat
            daytime_ratio: 0.5        // Exactly balanced
        },
        expected_cluster: 'energy_saver',
        description: 'Theoretical perfectly balanced consumption'
    },
    {
        name: 'Edge Case - Extreme Peak',
        characteristics: {
            peak_to_avg_ratio: 5.0,   // Maximum peak ratio
            daytime_ratio: 0.9        // Almost all daytime
        },
        expected_cluster: 'industrial',  // High peak + high daytime = Industrial
        description: 'Extreme solar export scenario (classified as Industrial due to extreme peak)'
    },
    {
        name: 'Edge Case - Night Industrial',
        characteristics: {
            peak_to_avg_ratio: 3.5,   // High peaks
            daytime_ratio: 0.1        // Almost all nighttime
        },
        expected_cluster: 'night_owl',
        description: 'Night-shift industrial operation'
    }
];

// Cluster center definitions (must match clustering.rs)
const CLUSTER_CENTERS = [
    { id: 'solar_enthusiast', x: 0.6, y: 0.8, color: '#f59e0b', name: 'Solar Enthusiast' },
    { id: 'night_owl', x: 0.5, y: 0.25, color: '#6366f1', name: 'Night Owl' },
    { id: 'energy_saver', x: 0.2, y: 0.55, color: '#22c55e', name: 'Energy Saver' },
    { id: 'home_worker', x: 0.35, y: 0.7, color: '#3b82f6', name: 'Home Worker' },
    { id: 'industrial', x: 0.8, y: 0.6, color: '#ef4444', name: 'Industrial User' },
];

/**
 * JavaScript implementation of the clustering algorithm
 * (for testing without WASM)
 */
function performClusteringJS(characteristics) {
    // Normalize characteristics for clustering
    const userX = Math.min(characteristics.peak_to_avg_ratio / 5.0, 1.0);
    const userY = characteristics.daytime_ratio;

    // Calculate Euclidean distance to each cluster center
    let minDistance = Infinity;
    let nearestClusterId = CLUSTER_CENTERS[0].id;

    for (const center of CLUSTER_CENTERS) {
        const distance = Math.sqrt(
            Math.pow(userX - center.x, 2) + Math.pow(userY - center.y, 2)
        );
        if (distance < minDistance) {
            minDistance = distance;
            nearestClusterId = center.id;
        }
    }

    return {
        user_position: { x: userX, y: userY },
        cluster_centers: CLUSTER_CENTERS,
        nearest_cluster: nearestClusterId,
        distance_to_cluster: minDistance
    };
}

/**
 * Run a single test case
 */
function runTestCase(testCase, index) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Test ${index + 1}: ${testCase.name}`);
    console.log('='.repeat(60));
    console.log(`Description: ${testCase.description}`);
    console.log(`Input:`);
    console.log(`  - Peak-to-Avg Ratio: ${testCase.characteristics.peak_to_avg_ratio}`);
    console.log(`  - Daytime Ratio: ${testCase.characteristics.daytime_ratio}`);
    console.log(`Expected Cluster: ${testCase.expected_cluster}`);

    // Run clustering
    const startTime = Date.now();
    const result = performClusteringJS(testCase.characteristics);
    const endTime = Date.now();

    console.log(`\nResults:`);
    console.log(`  - User Position: (${result.user_position.x.toFixed(4)}, ${result.user_position.y.toFixed(4)})`);
    console.log(`  - Nearest Cluster: ${result.nearest_cluster}`);
    console.log(`  - Distance: ${result.distance_to_cluster.toFixed(4)}`);
    console.log(`  - Computation Time: ${endTime - startTime}ms`);

    // Check distances to all clusters
    console.log(`\nDistances to all clusters:`);
    for (const center of CLUSTER_CENTERS) {
        const distance = Math.sqrt(
            Math.pow(result.user_position.x - center.x, 2) + 
            Math.pow(result.user_position.y - center.y, 2)
        );
        const marker = center.id === result.nearest_cluster ? '← NEAREST' : '';
        console.log(`  - ${center.name.padEnd(20)}: ${distance.toFixed(4)} ${marker}`);
    }

    // Verify result
    const passed = result.nearest_cluster === testCase.expected_cluster;
    console.log(`\n${passed ? '✅ PASSED' : '❌ FAILED'}: Expected ${testCase.expected_cluster}, got ${result.nearest_cluster}`);

    return {
        passed,
        testCase: testCase.name,
        expected: testCase.expected_cluster,
        actual: result.nearest_cluster,
        distance: result.distance_to_cluster,
        computationTime: endTime - startTime
    };
}

/**
 * Run performance benchmark
 */
function runPerformanceBenchmark(iterations = 10000) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Performance Benchmark (${iterations.toLocaleString()} iterations)`);
    console.log('='.repeat(60));

    const testCharacteristics = {
        peak_to_avg_ratio: 2.5,
        daytime_ratio: 0.6
    };

    const startTime = Date.now();
    for (let i = 0; i < iterations; i++) {
        performClusteringJS(testCharacteristics);
    }
    const endTime = Date.now();

    const totalTime = endTime - startTime;
    const opsPerSec = iterations / (totalTime / 1000);

    console.log(`\nResults:`);
    console.log(`  - Total Time: ${totalTime}ms`);
    console.log(`  - Operations/Second: ${opsPerSec.toLocaleString(undefined, { maximumFractionDigits: 0 })}`);
    console.log(`  - Avg Time per Operation: ${(totalTime / iterations).toFixed(4)}ms`);
    console.log(`  - Iterations: ${iterations.toLocaleString()}`);

    return {
        totalTime,
        opsPerSec,
        avgTimePerOp: totalTime / iterations
    };
}

/**
 * Generate visualization data
 */
function generateVisualizationData() {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Cluster Visualization Data`);
    console.log('='.repeat(60));

    // Generate a grid of test points
    const gridData = [];
    for (let x = 0; x <= 1.0; x += 0.1) {
        for (let y = 0; y <= 1.0; y += 0.1) {
            const result = performClusteringJS({
                peak_to_avg_ratio: x * 5,  // Denormalize
                daytime_ratio: y
            });
            gridData.push({
                x: x.toFixed(1),
                y: y.toFixed(1),
                cluster: result.nearest_cluster,
                distance: result.distance_to_cluster.toFixed(4)
            });
        }
    }

    console.log('\nCluster Regions (10x10 grid):');
    console.log('X-axis: Peak-to-Avg Ratio (0-5, normalized 0-1)');
    console.log('Y-axis: Daytime Ratio (0-1)\n');

    // Print grid
    for (let yi = 9; yi >= 0; yi--) {
        let row = '';
        for (let xi = 0; xi <= 9; xi++) {
            const point = gridData.find(p => p.x === (xi / 10).toFixed(1) && p.y === (yi / 10).toFixed(1));
            if (point) {
                const cluster = point.cluster;
                const symbol = cluster.charAt(0).toUpperCase();
                row += `${symbol} `.padEnd(4);
            }
        }
        console.log(`Y=${yi/10}: ${row}`);
    }

    console.log('\nLegend:');
    CLUSTER_CENTERS.forEach(c => {
        console.log(`  ${c.name.charAt(0)} = ${c.name}`);
    });

    return gridData;
}

/**
 * Main test runner
 */
function main() {
    console.log('╔══════════════════════════════════════════════════════════╗');
    console.log('║     ML Energy Profile Clustering Test Suite              ║');
    console.log('║     GridTokenX Platform - WASM Inference Engine          ║');
    console.log('╚══════════════════════════════════════════════════════════╝');
    console.log(`\nTest Started: ${new Date().toISOString()}`);
    console.log(`Algorithm: K-Means Style Clustering (Euclidean Distance)`);
    console.log(`Features: Peak-to-Avg Ratio, Daytime Ratio`);
    console.log(`Clusters: ${CLUSTER_CENTERS.length} archetypes`);

    const results = [];

    // Run all test cases
    TEST_CASES.forEach((testCase, index) => {
        const result = runTestCase(testCase, index);
        results.push(result);
    });

    // Run performance benchmark
    const perfResults = runPerformanceBenchmark(10000);

    // Generate visualization data
    generateVisualizationData();

    // Summary
    console.log(`\n${'='.repeat(60)}`);
    console.log(`TEST SUMMARY`);
    console.log('='.repeat(60));

    const passed = results.filter(r => r.passed).length;
    const failed = results.filter(r => !r.passed).length;
    const passRate = (passed / results.length * 100).toFixed(1);

    console.log(`\nTest Results:`);
    console.log(`  ✅ Passed: ${passed}/${results.length}`);
    console.log(`  ❌ Failed: ${failed}/${results.length}`);
    console.log(`  📊 Pass Rate: ${passRate}%`);

    console.log(`\nPerformance:`);
    console.log(`  ⚡ Avg Operation Time: ${perfResults.avgTimePerOp.toFixed(4)}ms`);
    console.log(`  🚀 Operations/Second: ${perfResults.opsPerSec.toLocaleString()}`);

    if (failed > 0) {
        console.log(`\n❌ Failed Tests:`);
        results.filter(r => !r.passed).forEach(r => {
            console.log(`  - ${r.testCase}: Expected ${r.expected}, got ${r.actual}`);
        });
    }

    // Save results to file
    const reportData = {
        timestamp: new Date().toISOString(),
        algorithm: 'K-Means Style Clustering',
        testResults: results,
        performance: perfResults,
        summary: {
            total: results.length,
            passed,
            failed,
            passRate
        }
    };

    const reportPath = path.join(__dirname, 'ml-clustering-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
    console.log(`\n📄 Full report saved to: ${reportPath}`);

    console.log(`\n${'='.repeat(60)}`);
    if (failed === 0) {
        console.log('🎉 ALL TESTS PASSED! ML Energy Profile Clustering is working correctly.');
    } else {
        console.log('⚠️  Some tests failed. Review the results above.');
    }
    console.log('='.repeat(60));

    process.exit(failed > 0 ? 1 : 0);
}

// Run tests
main();
