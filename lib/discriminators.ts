/**
 * Anchor discriminator utilities.
 * Each discriminator is the first 8 bytes of SHA-256("global:instruction_name").
 */

export function discriminator(name: string): Buffer {
  const map: Record<string, number[]> = {
    // Energy Token
    'global:initialize': [175, 175, 109, 31, 13, 152, 155, 237],
    'global:initialize_dual_token': [249, 235, 37, 193, 156, 61, 10, 51],
    'global:mint_grid': [69, 164, 218, 155, 126, 174, 204, 212],
    'global:swap_grid_to_grx': [14, 208, 227, 213, 16, 47, 104, 16],
    'global:burn_grx': [24, 182, 100, 26, 89, 135, 140, 73],
    'global:transfer_grid': [15, 70, 151, 203, 165, 23, 172, 74],
    'global:transfer_grx': [122, 173, 202, 110, 255, 9, 211, 139],
    'global:create_grx_metadata': [118, 99, 4, 165, 178, 173, 145, 78],
    'global:sync_supplies': [81, 183, 198, 187, 154, 187, 51, 145],

    // Registry
    'global:initialize_shard': [100, 96, 88, 58, 225, 178, 9, 147],
    'global:register_user': [2, 241, 150, 223, 99, 214, 116, 97],
    'global:register_meter': [49, 106, 87, 72, 138, 214, 224, 125],
    'global:settle_and_mint_tokens': [51, 103, 164, 65, 160, 57, 142, 220],

    // Trading
    'global:initialize_program': [176, 107, 205, 168, 24, 157, 175, 103],
    'global:initialize_config': [208, 127, 21, 1, 194, 190, 196, 70],
    'global:update_maintenance_mode': [96, 43, 2, 84, 62, 163, 229, 164],
    'global:initialize_market': [35, 35, 189, 193, 155, 48, 170, 203],
    'global:create_sell_order': [53, 52, 255, 44, 191, 74, 171, 225],
    'global:create_buy_order': [182, 87, 0, 160, 192, 66, 151, 130],
    'global:match_orders': [17, 1, 201, 93, 7, 51, 251, 134],
    'global:cancel_order': [95, 129, 237, 240, 8, 49, 223, 132],
    'global:settle_offchain_match': [140, 170, 63, 151, 81, 62, 212, 11],
  };

  const disc = map[name];
  if (!disc) throw new Error(`Unknown discriminator: ${name}`);
  return Buffer.from(disc);
}
